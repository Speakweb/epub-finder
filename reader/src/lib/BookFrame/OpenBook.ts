import {combineLatest, merge, Observable, ReplaySubject} from "rxjs";
import {map, shareReplay} from "rxjs/operators";
import {BookWordCount} from "../Interfaces/BookWordCount";
import {AtomizedSentence} from "../Atomized/AtomizedSentence";
import {TrieWrapper} from "../TrieWrapper";
import {BookWordData, TextWordData} from "../Atomized/TextWordData";
import {Frame} from "./Frame";
import {AtomizedDocumentBookStats, AtomizedDocumentStats} from "../Atomized/AtomizedDocumentStats";
import {printExecTime} from "../Util/Timer";
import {IFrameBookRenderer} from "./Renderer/IFrameBookRenderer";
import {ds_Dict} from "../Util/DeltaScanner";
import {BrowserInputs} from "../Manager/BrowserInputs";
import {AtomizedStringForRawHTML} from "../Pipes/AtomizedStringForRawHTML";
import {ANNOTATE_AND_TRANSLATE, AtomizedDocument} from "../Atomized/AtomizedDocument";
import {AtomizedStringForURL} from "../Pipes/AtomizedStringForURL";
import {sleep} from "../Util/Util";

/*
export type AtomizedDocumentSentenceDataPipe = (atomizedSrcDocStringAndTrie$: Observable<[string, TrieWrapper]>) => Observable<AtomizedDocumentStats>;
export type AtomizedDocumentStringPipe = (unatomizedSrcDoc$: Observable<string>) => Observable<string>;
*/

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
    public frame = new Frame();
    public id: string;
    public text$: Observable<string>;
    public wordCountRecords$: Observable<BookWordCount[]>;
    public htmlElementIndex$: Observable<TextWordData>;
    public renderedSentences$ = new ReplaySubject<ds_Dict<AtomizedSentence>>(1)
    public bookStats$: Observable<AtomizedDocumentBookStats>;

    public unAtomizedSrcDoc$ = new ReplaySubject<string>(1);
    public url$ = new ReplaySubject<string>(1)

    public renderRoot$ = new ReplaySubject<HTMLBodyElement>(1);
    atomizedSrcDocString$: Observable<string>;
    atomizedDocument$: Observable<AtomizedDocument>;

    constructor(
        public name: string,
        public trie: Observable<TrieWrapper>,
    ) {
        this.id = name;
        this.atomizedSrcDocString$ = merge(
            this.unAtomizedSrcDoc$.pipe(
                AtomizedStringForRawHTML
            ),
            this.url$.pipe(
                AtomizedStringForURL
            )
        );
        this.atomizedDocument$ = this.atomizedSrcDocString$.pipe(
/*
            tap(() => {
                if (this.name === 'ExampleSentences') {
                    debugger;console.log()
                }
            }),
*/
            map(AtomizedDocument.fromString)
        )
        this.bookStats$ = combineLatest([
            this.atomizedDocument$,
            trie
        ]).pipe(
            map(([document, trie]) => {
                const stats = document.getDocumentStats(trie);
                return getAtomizedDocumentBookStats(stats, this.name);
            }),
            shareReplay(1)
        )
        this.text$ = this.bookStats$.pipe(map(bookStats => bookStats.text), shareReplay(1))
        this.wordCountRecords$ = this.bookStats$.pipe(
            map(bookStat => {
                if (bookStat.bookWordCounts['宋']) {
                    debugger;console.log();
                }
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
    }
    async handleHTMLHasBeenRendered(head: HTMLHeadElement, body: HTMLBodyElement) {
        await sleep(500);
        // @ts-ignore
        const t = body.ownerDocument.getElementsByClassName(ANNOTATE_AND_TRANSLATE);
        const sentences = printExecTime("Rehydration", () => {
            return IFrameBookRenderer.rehydratePage(body.ownerDocument as HTMLDocument);
        });
        this.renderRoot$.next((body.ownerDocument as HTMLDocument).body as HTMLBodyElement);
        this.renderedSentences$.next(sentences);
    }
}

