import {getIndexOfEl} from "../Util/getIndexOfEl";
import {Dictionary, uniqueId} from 'lodash';
import {DOMParser, XMLSerializer} from "xmldom";
import {AtomizedSentence} from "./AtomizedSentence";
import {XMLDocumentNode} from "../Interfaces/XMLDocumentNode";
import {splitKeepDelim, splitPunctuation} from "../Util/Util";
import {isChineseCharacter} from "../Interfaces/OldAnkiClasses/Card";
import {TrieWrapper} from "../TrieWrapper";
import {AtomizedDocumentStats} from "./AtomizedDocumentStats";
import {mergeSentenceInfo} from "./TextWordData";
import {chunk} from 'lodash';
import {interpolateSourceDoc} from "./AtomizedDocumentFromSentences";

export const ANNOTATE_AND_TRANSLATE = 'annotated_and_translated';

export function createPopperElement(document1: XMLDocument) {

    const popperEl = document1.createElement('div');
    const popperId = uniqueId();
    popperEl.setAttribute("class", "translation-popover");
    popperEl.setAttribute('id', AtomizedDocument.getPopperId(popperId));
    popperEl.setAttribute("class", "POPPER_ELEMENT");
    return {popperEl, popperId};
}

export class AtomizedDocument {
    public static getPopperId(popperId: string) {
        return `translate-popper_${popperId}`;
    }

    public static atomizeDocument(xmlsource: string): AtomizedDocument {
        const doc = new AtomizedDocument(new DOMParser().parseFromString(xmlsource, 'text/html'));
        doc.ensurePopperContainer();
        doc.replaceDocumentSources(doc.document);
        doc.splitLongTextElements(doc.getTextElements(doc.document));
        doc.createMarksUnderLeaves(doc.getTextElements(doc.document));
        return doc;
    }

    public static find(document: XMLDocument, cb: (n: Node) => boolean): Node | undefined {
        function walk(node: Node, cb: (n: Node) => any): Node | undefined {
            if (cb(node)) {
                return node;
            }
            var child, next;
            let TEXT_NODE = 3;
            let ELEMENT_NODE = 1;
            let DOCUMENT_NODE = 9;
            switch (node.nodeType) {
                case TEXT_NODE: // Text node
                    break;
                case ELEMENT_NODE: // Element node
                    // @ts-ignore
                    if (node.localName === 'script') break;
                    // @ts-ignore
                    if (node.localName === 'style') break;
                case DOCUMENT_NODE: // Document node
                    child = node.firstChild;
                    while (child) {
                        next = child.nextSibling;
                        let foundNode = walk(child, cb);
                        if (foundNode) {
                            return foundNode;
                        }
                        child = next;
                    }
                    break;
            }
        }

        return walk(document, n => {
            return cb(n)
        });
    }

    public static fromAtomizedString(atomizedString: string) {
        return new AtomizedDocument(new DOMParser().parseFromString(atomizedString));
    }

    constructor(public document: XMLDocument) {
    }

    public getChunkedDocuments() {
        return chunk(this.getAtomizedSentences(), 20)
            .map(sentenceChunk => AtomizedDocument.atomizeDocument(interpolateSourceDoc(sentenceChunk.map(sentence => sentence.translatableText))))
    }

    private static replaceHrefOrSource(el: Element, qualifiedName: string) {
        let currentSource = el.getAttribute(qualifiedName);
        if (currentSource && !currentSource.startsWith("data")) {
            el.setAttribute(qualifiedName, `${process.env.PUBLIC_URL}/${currentSource}`);
        }
    }

    private getTextElements(doc: Document) {
        const leaves: Element[] = [];

        function walk(node: Node, cb: (n: Node) => any) {
            var child, next;
            switch (node.nodeType) {
                case 3: // Text node
                    cb(node);
                    break;
                case 1: // Element node
                    // @ts-ignore
                    if (node.localName === 'script') break;
                    // @ts-ignore
                    if (node.localName === 'style') break;
                case 9: // Document node
                    child = node.firstChild;
                    while (child) {
                        next = child.nextSibling;
                        walk(child, cb);
                        child = next;
                    }
                    break;
            }
        }

        walk(doc, (node: Node) => {
            let text = (node.textContent as string).trim();
            if (text) {
                leaves.push(node as Element);
            }
        })
        return leaves;
    }

    appendRehydratableText(str: string): XMLDocumentNode {
        const div = this.document.createElement('div');
        const textNode = this.document.createTextNode(str);
        this.document.body.appendChild(div);
        div.appendChild(textNode);
        return this.makeTextNodeRehydratable(textNode as unknown as Element)
    }

    makeTextNodeRehydratable(textNode: Element): XMLDocumentNode {
        let document1 = this.document;
        let nodeValue = textNode.nodeValue as string;
        const newParent = this.replaceTextNodeWithSubTextNode(
            textNode,
            nodeValue.normalize().trim().split(''),
            "mark"
        );
        const {popperEl, popperId} = createPopperElement(document1);
        newParent.setAttribute('popper-id', popperId);
        newParent.setAttribute("class", ANNOTATE_AND_TRANSLATE);
        (this.findPopperContainer() as Node).insertBefore(popperEl, popperEl.firstChild);
        return newParent as unknown as XMLDocumentNode;
    }

    replaceTextNodeWithSubTextNode(textNode: Element, newSubStrings: string[], newTagType: string) {
        const indexOfMe = getIndexOfEl(textNode);
        (textNode.parentNode as Element).removeChild(textNode);
        const newParent = this.document.createElement('span');
        newSubStrings.forEach(string => {
            // I'll probably need to do labelling later so the data can be rehydrated
            // Perhaps this is inefficient, but for character based stuff its probably fine
            const mark = this.document.createElement(newTagType);
            const textNode = this.document.createTextNode(string);
            mark.insertBefore(textNode, null);
            newParent.insertBefore(mark, null)
        })
        const oldParent = textNode.parentNode as Element;
        oldParent.insertBefore(newParent, oldParent.childNodes.length ? oldParent.childNodes[indexOfMe] : null);
        return newParent;
    }

    replaceDocumentSources(doc: Document) {
        const walk = (node: Node) => {
            var child, next;
            switch (node.nodeType) {
                case 1: // Element node
                    const el = node as Element;
                    AtomizedDocument.replaceHrefOrSource(el, "src");
                    if (el.localName === "link") {
                        AtomizedDocument.replaceHrefOrSource(el, "href");
                    }
                case 9: // Document node
                    child = node.firstChild;
                    while (child) {
                        next = child.nextSibling;
                        walk(child);
                        child = next;
                    }
                    break;
            }
        }
        walk(doc);
        return doc;
    }

    splitLongTextElements(textElements: Element[]) {
        textElements.forEach(textNode => {
            const split =  splitKeepDelim('。')(textNode.nodeValue as string);
            if (split.length > 1) {
                this.replaceTextNodeWithSubTextNode(
                    textNode,
                    split,
                    "div"
                );
            }
        })
    }

    createMarksUnderLeaves(textNodes: Element[]) {
        for (let i = 0; i < textNodes.length; i++) {
            this.makeTextNodeRehydratable(textNodes[i]);
        }
    }

    getAtomizedSentences(): AtomizedSentence[] {
        const sentenceElements = this.document.getElementsByClassName(ANNOTATE_AND_TRANSLATE)
        const atomized = new Array(sentenceElements.length);
        for (let i = 0; i < sentenceElements.length; i++) {
            const sentenceElement = sentenceElements[i];
            atomized[i] = new AtomizedSentence(sentenceElement as unknown as XMLDocumentNode);
        }
        return atomized;
    }

    getDocumentStats(trie: TrieWrapper): AtomizedDocumentStats {
        const atomizedSentences = this.getAtomizedSentences();
        const sentenceStats = atomizedSentences.map(atomizedSentence => atomizedSentence.getTextWordData(trie.t, trie.getUniqueLengths()))
        const data = mergeSentenceInfo(...sentenceStats);
        return {
            wordCounts: data.wordCounts,
            wordSentenceMap: data.wordSentenceMap,
            text: atomizedSentences.map(sentence => sentence.translatableText).join('\n'),
            head: this.headInnerHTML(),
            body: this.bodyInnerHTML(),
        }
    }

    headInnerHTML() {
        const head = this.findHead();
        return (new XMLSerializer()).serializeToString(<Node>head)
    }

    private findHead() {
        return AtomizedDocument.find(this.document, n => {
            // @ts-ignore
            return n.tagName === 'head';
        });
    }

    bodyInnerHTML() {
        const body = this.findBody();
        return (new XMLSerializer()).serializeToString(<Node>body)
    }

    private findBody(): Element {
        // @ts-ignore
        return AtomizedDocument.find(this.document, n => {
            // @ts-ignore
            return n.tagName === 'body';
        });
    }

    private ensurePopperContainer() {
        if (!this.findPopperContainer()) {
            const popperEl = this.document.createElement('div');
            popperEl.setAttribute("class", "popper-container");
            const body = this.findBody();
            body.insertBefore(popperEl, body.firstChild);
            if (!this.findPopperContainer()) {
                throw new Error("Cannot find popper container")
            }
        }
        // @ts-ignore
        return AtomizedDocument.find(this.document, n => {
            // @ts-ignore
            return n.tagName === 'body';
        });
    }
    private findPopperContainer() {
        // @ts-ignore
        return AtomizedDocument.find(this.document, (n) => {
            // @ts-ignore
            let namedItem = n.attributes?.getNamedItem('class')?.nodeValue;
            return namedItem === 'popper-container';
        });
    }

    public toString() {
        return new XMLSerializer().serializeToString(this.document);
    }
}

