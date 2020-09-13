import {combineLatest, merge, Observable, of, ReplaySubject} from "rxjs";
import {map, pluck, shareReplay} from "rxjs/operators";
import {BookWordCount} from "../Interfaces/BookWordCount";
import {AtomizedSentence} from "../Atomized/AtomizedSentence";
import {TrieWrapper} from "../TrieWrapper";
import {BookWordData, TextWordData} from "../Atomized/TextWordData";
import {AtomizedDocumentBookStats, AtomizedDocumentStats} from "../Atomized/AtomizedDocumentStats";
import {printExecTime} from "../Util/Timer";
import {IFrameBookRenderer} from "./Renderer/IFrameBookRenderer";
import {ds_Dict} from "../Util/DeltaScanner";
import {BrowserInputs} from "../Manager/BrowserInputs";
import {AtomizedStringsForRawHTML} from "../Pipes/AtomizedStringsForRawHTML";
import {ANNOTATE_AND_TRANSLATE, AtomizedDocument} from "../Atomized/AtomizedDocument";
import {AtomizedStringsForURL} from "../Pipes/AtomizedStringsForURL";

export function getAtomizedDocumentBookStats(stats: AtomizedDocumentStats, name: string): AtomizedDocumentBookStats {
    return {
        ...stats,
        bookWordCounts: Object.fromEntries(
            Object.entries(stats.wordCounts).map(([word, count]) => [word, {count, word, book: name}])
        )
    }
}

export function getBookWordData(stats: TextWordData, name: string): BookWordData {
    return {
        ...stats,
        bookWordCounts: Object.fromEntries(
            Object.entries(stats.wordCounts).map(([word, count]) => [word, [{count, word, book: name}]])
        )
    }
}

export class OpenBook {
    public id: string;
    public text$: Observable<string>;
    public wordCountRecords$: Observable<BookWordCount[]>;
    public htmlElementIndex$: Observable<TextWordData>;
    public renderedSentences$ = new ReplaySubject<ds_Dict<AtomizedSentence>>(1)
    public bookStats$: Observable<AtomizedDocumentBookStats>;

    public unAtomizedSrcDoc$: Observable<string> = new ReplaySubject<string>(1);
    public url$ = new ReplaySubject<string>(1)

    public renderRoot$ = new ReplaySubject<HTMLBodyElement>(1);
    atomizedSrcDocString$: Observable<string>;
    atomizedDocument$: Observable<AtomizedDocument>;

    children$: Observable<ds_Dict<OpenBook>>;
    atomizedSrcDocStrings$: Observable<string[]>;


    constructor(
        public name: string,
        public trie: Observable<TrieWrapper>,
        atomizedDocuments$?: Observable<AtomizedDocument>
    ) {
        this.id = name;
        this.atomizedSrcDocStrings$ = merge(
            this.unAtomizedSrcDoc$.pipe(
                AtomizedStringsForRawHTML,
            ),
            this.url$.pipe(
                AtomizedStringsForURL,
            )
        ).pipe(shareReplay(1));
        this.atomizedSrcDocString$ = this.atomizedSrcDocStrings$.pipe(
            map(strings => {
                return strings[0];
            }),
            shareReplay(1)
        );
        this.atomizedDocument$ = atomizedDocuments$ || this.atomizedSrcDocString$.pipe(
            map(AtomizedDocument.fromString),
            shareReplay(1)
        )
        this.bookStats$ = combineLatest([
            this.atomizedDocument$,
            trie
        ]).pipe(
            map(([document, trie]) => {
                debugger;
                const stats = document.getDocumentStats(trie);
                return getAtomizedDocumentBookStats(stats, this.name);
            }),
            shareReplay(1)
        )
        this.text$ = this.bookStats$.pipe(map(bookStats => bookStats.text), shareReplay(1))
        this.wordCountRecords$ = this.bookStats$.pipe(
            map(bookStat => {
                    return Object.values(bookStat.bookWordCounts);
                }
            ),
            shareReplay(1)
        );
        this.renderedSentences$.subscribe(sentences => {
            BrowserInputs.applyAtomizedSentenceListeners(Object.values(sentences));
        })

        this.htmlElementIndex$ = combineLatest([
            this.trie,
            this.renderedSentences$
        ]).pipe(
            map(([trie, sentences]) => {
                    return AtomizedSentence.getTextWordData(Object.values(sentences), trie.t, trie.getUniqueLengths());
                },
            ),
            shareReplay(1)
        )

        this.children$ = this.atomizedSrcDocStrings$.pipe(
            map(([originalDoc, ...documentChunks]) => {
                debugger;
                return Object.fromEntries(
                        documentChunks.map((childDocStr, index) => {
                            let childName = `${this.name}_${index}`;
                            debugger;
                            let args = AtomizedDocument.fromString(childDocStr);
                            const childDoc = of(args)
                            return [
                                childName,
                                new OpenBook(childName, trie, childDoc)
                            ];
                        })
                    );
                }
            ),
            shareReplay(1)
        );
    }

    async handleHTMLHasBeenRendered(head: HTMLHeadElement, body: HTMLBodyElement) {
        // @ts-ignore
        const t = body.ownerDocument.getElementsByClassName(ANNOTATE_AND_TRANSLATE);
        const sentences = printExecTime("Rehydration", () => {
            return IFrameBookRenderer.rehydratePage(body.ownerDocument as HTMLDocument);
        });
        this.renderRoot$.next((body.ownerDocument as HTMLDocument).body as HTMLBodyElement);
        this.renderedSentences$.next(sentences);
    }
}

