import {fromEvent, merge, ReplaySubject, Subject} from "rxjs";
import { Dictionary } from "lodash";
import {AtomizedSentence} from "../Atomized/AtomizedSentence";
import {getTranslation} from "../Util/Util";
import {createPopper} from "@popperjs/core";
import {filter} from "rxjs/operators";


export interface BrowserInputsConfig {

}


export enum HotkeyModes  {
    TextInput="TextInput",
    Reading="Reading"
}

export function isDocument(t: HTMLElement | Document): t is Document  {
    return !t.hasOwnProperty('tagName');
}

export function hotkeyMode(t: HTMLElement | Document | null): HotkeyModes {
    if (!t) return HotkeyModes.Reading;

    if (isDocument(t)) {
        return HotkeyModes.Reading;
    }

    switch(t.tagName) {
        case "INPUT":
        case "TEXTAREA":
            return HotkeyModes.TextInput;
        default:
            return HotkeyModes.Reading;
    }
}


export function isListening(keyMode: HotkeyModes, keyListeningFor: string) {
    switch(keyMode) {
        case HotkeyModes.TextInput:
            return keyListeningFor === 'Escape';
        case HotkeyModes.Reading:
            return true;
    }
}


/**
 * If the key you're listening for is
 */

export class BrowserInputs {
    keydownMap: Dictionary<Subject<KeyboardEvent>> = {};
    keyupMap: Dictionary<Subject<KeyboardEvent>> = {};
    selectedText$: Subject<string> = new Subject<string>();
    hoveredSentence$ = new ReplaySubject<string | undefined>(1);
    hoveredCharacterIndex$ = new ReplaySubject<number | undefined>(1);
    hotkeyHandler$ = new ReplaySubject<HTMLElement | Document | null>(1);

    constructor() {}

    applyDocumentListeners(root: HTMLDocument) {
        root.onkeydown = (ev) => {
            return this.keydownMap[ev.key]?.next(ev);
        };
        root.onkeyup = (ev) => this.keyupMap[ev.key]?.next(ev);

        const checkForSelectedText = () => {
            const activeEl = root.activeElement;
            if (activeEl) {
                // @ts-ignore
                const selObj = root.getSelection();
                if (selObj) {
                    const text = selObj.toString();
                    if (text) {
                        this.selectedText$.next(text);
                    }
                    return;
                }
            }
        };
        root.onmouseup = checkForSelectedText;

        // @ts-ignore
        root.onfocus = ev => this.hotkeyHandler$.next(ev.target);
        // @ts-ignore
        root.onmousedown = ev => this.hotkeyHandler$.next(ev.target);

        this.getKeyUpSubject("Shift").subscribe(checkForSelectedText);
    }
    getKeyDownSubject(key: string): Subject<KeyboardEvent> {
        if (!this.keydownMap[key]) this.keydownMap[key] = new Subject<KeyboardEvent>()
        return this.keydownMap[key];
    }
    getKeyUpSubject(key: string) {
        if (!this.keyupMap[key]) this.keyupMap[key] = new Subject<KeyboardEvent>()
        return this.keyupMap[key];
    }


    public applyAtomizedSentenceListeners(atomizedSentences: AtomizedSentence[]) {
        atomizedSentences.forEach(atomizedSentence => {
            atomizedSentence.getSentenceHTMLElement().onmouseenter = async (ev: MouseEvent) => {
                atomizedSentence.getTranslation();
            };
            const showEvents = ['mouseenter', 'focus'];
            const hideEvents = ['mouseleave', 'blur'];
            let sentenceHTMLElement = atomizedSentence.getSentenceHTMLElement();
            sentenceHTMLElement.classList.add('applied-sentence-listener');
            let popperHTMLElement = atomizedSentence.getPopperHTMLElement();
            if (!sentenceHTMLElement || !popperHTMLElement) {
                throw new Error("Cannot find sentenceElement or popperElement")
            }
            try {
                createPopper(sentenceHTMLElement, popperHTMLElement, {
                    placement: 'top-start',
                    // strategy: 'fixed'
                });
            } catch (e) {
                console.error(e);
            }

            const show = () => {
                this.hoveredSentence$.next(atomizedSentence.translatableText);
                popperHTMLElement.setAttribute('data-show', '');
            }
            const hide = () => {
                popperHTMLElement.removeAttribute('data-show');
            }

            showEvents.forEach(event => {
                sentenceHTMLElement.addEventListener(event, show);
            });

            hideEvents.forEach(event => {
                sentenceHTMLElement.addEventListener(event, hide);
            });
        });
    }

}

export const filterTextInputEvents = filter((ev: KeyboardEvent) => {
    let tagName = (ev.target as HTMLElement).tagName;
    return !(tagName === 'INPUT' || tagName === "TEXTAREA")
});
