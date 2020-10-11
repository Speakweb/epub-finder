import {combineLatest, Observable, of, ReplaySubject, Subject} from "rxjs";
import {map, shareReplay, startWith, switchMap, withLatestFrom} from "rxjs/operators";
import {getBookWordData, OpenBook} from "../BookFrame/OpenBook";
import {CustomDocument, Website} from "../Website/Website";
import {AtomizedSentence} from "../Atomized/AtomizedSentence";
import {OpenBooksConfig} from "./BookFrameManager/OpenBooksConfig";
import {Dictionary, flatten, flattenDeep} from "lodash";
import {DeltaScan, DeltaScanner, ds_Dict, flattenTree} from "../Util/DeltaScanner";
import {BookWordData, TextWordData} from "../Atomized/TextWordData";
import {TrieWrapper} from "../TrieWrapper";
import {NavigationPages} from "../Util/Util";
import {IAnnotatedCharacter} from "../Interfaces/Annotation/IAnnotatedCharacter";
import {mergeDictArrays} from "../Util/mergeAnnotationDictionary";
import {AtomizedDocument} from "../Atomized/AtomizedDocument";


export type Named = {
    name: string;
}

export const flattenNamedObject = (key: string) =>
    <T extends Named, U extends string>(obs$: Observable<DeltaScan<T, U>>): Observable<ds_Dict<T>> => {
        return obs$.pipe(
            map(({sourced}) => {
                const libraryBooks = sourced?.children?.[key];
                return Object.fromEntries(
                    libraryBooks ? flattenTree<T>(
                        libraryBooks
                    ).map(book => [book.name, book]) : []
                );
            })
        );
    }

export const LIBRARY_BOOKS_NODE_LABEL = 'libraryBooks';
export const CHARACTER_BOOK_NODE_LABEL = 'CharacterPageBook';
export const READING_BOOK_NODE_LABEL = 'readingBook';

export class OpenBooks {
    openedBooks = new DeltaScanner<OpenBook, string>();
    renderedAtomizedSentences$: Observable<ds_Dict<AtomizedSentence[]>>;
    addOpenBook$ = new Subject<Website | CustomDocument>();
    renderedSentenceTextDataTree$: DeltaScanner<Observable<BookWordData[]>>;
    exampleSentenceSentenceData$: Observable<TextWordData[]>;
    renderedBookSentenceData$: Observable<BookWordData[]>;
    visibleElements$: Observable<Dictionary<IAnnotatedCharacter[]>>;
    library$: Observable<ds_Dict<OpenBook>>;
    readingBook: OpenBook;
    sourceBooks$: Observable<ds_Dict<OpenBook>>;
    readingDocument$: Observable<AtomizedDocument>;
    readingBook$ = new ReplaySubject<OpenBook>(1);

    // renderedSentences$: Observable<ds_Dict<AtomizedSentence[]>>;

    constructor(
        private config: OpenBooksConfig
    ) {
        this.addOpenBook$
            .pipe(
                map(page => {
                    const isWebsite = (variableToCheck: any): variableToCheck is Website =>
                        (variableToCheck as Website).url !== undefined;
                    const isCustomDocument = (variableToCheck: any): variableToCheck is CustomDocument =>
                        (variableToCheck as CustomDocument).html !== undefined;
                    if (isCustomDocument(page)) {
                        return new OpenBook(
                            page.name,
                            config.trie$,
                            of(AtomizedDocument.atomizeDocument(page.html)),
                            undefined,
                            config.applyAtomizedSentencesListener
                        );
                    } else if (isWebsite(page)) {
                        const b = new OpenBook(
                            page.name,
                            config.trie$,
                            undefined,
                            undefined,
                            config.applyAtomizedSentencesListener
                        );
                        b.url$.next(page.url);
                        return b;
                    }
                    throw new Error("Unknown addOpenBook ");
                }),
            )
            .subscribe((openBook) => {
                this.openedBooks.appendDelta$.next(
                    {
                        nodeLabel: 'root',
                        children: {
                            [LIBRARY_BOOKS_NODE_LABEL]: {
                                nodeLabel: LIBRARY_BOOKS_NODE_LABEL,
                                children: {
                                    [openBook.name]: {
                                        nodeLabel: openBook.name,
                                        value: openBook
                                    }
                                }
                            }
                        }
                    }
                )
            });


        this.applyListenersToOpenedBookBodies();

        this.renderedAtomizedSentences$ = this.openedBooks
            .mapWith((bookFrame: OpenBook) => bookFrame.renderedSentences$).updates$.pipe(
                switchMap(({sourced}) => {
                    let sources = sourced ? flattenTree(sourced) : [];
                    return combineLatest(sources);
                }),
                map((atomizedSentenceArrays) =>
                    mergeDictArrays(...atomizedSentenceArrays)
                ),
                shareReplay(1)
            );

        this.renderedSentenceTextDataTree$ = this
            .openedBooks
            .mapWith(bookFrame => {
                    return combineLatest([
                        bookFrame.renderedSentences$,
                        config.trie$
                    ]).pipe(
                        map(([sentences, trie]: [ds_Dict<AtomizedSentence[]>, TrieWrapper]) => {
                                return flatten(Object.entries(sentences).map(([sentenceStr, sentences]) =>
                                    sentences.map(sentence =>
                                        getBookWordData(sentence.getTextWordData(trie.t, trie.getUniqueLengths()), bookFrame.name)
                                    )
                                ));
                            }
                        ),
                        shareReplay(1)
                    );
                }
            );
        this.renderedSentenceTextDataTree$.updates$.subscribe(({delta}) => {
            combineLatest(flattenTree(delta))
                .subscribe(bookStats => {
                    bookStats.forEach(atomizedSentenceStats => {
                        atomizedSentenceStats.forEach(sentenceStats => {
                            flatten(Object.values(sentenceStats.wordElementsMap)).forEach(config.applyWordElementListener)
                        })
                    })
                })
        });



        this.sourceBooks$ = this.openedBooks.updates$.pipe(flattenNamedObject(LIBRARY_BOOKS_NODE_LABEL));

        this.library$ = this.sourceBooks$.pipe(
            switchMap(sourceBooks =>
                combineLatest(Object.values(sourceBooks).map(sourceBook => sourceBook.children$))
            ),
            map(bookChildrenList => {
                    return Object.fromEntries(
                        flatten(
                            bookChildrenList.map(
                                bookChildrenMap => Object.values(bookChildrenMap).map(bookChild => [bookChild.name, bookChild])
                            )
                        )
                    );
                }
            )
        )

        this.renderedBookSentenceData$ = this.renderedSentenceTextDataTree$
            .updates$.pipe(
                switchMap(({sourced}) => {
                    // I only want the tree from 'readingFrames'
                    const readingFrames = sourced?.children?.[READING_BOOK_NODE_LABEL];
                    return combineLatest(readingFrames ? flattenTree<Observable<BookWordData[]>>(readingFrames) : []);
                }),
                map((v: BookWordData[][]) => {
                    return flatten(v);
                }),
                shareReplay(1)
            );

        this.exampleSentenceSentenceData$ = this.renderedSentenceTextDataTree$
            .updates$.pipe(
                switchMap(({sourced}) => {
                    // I only want the tree from 'readingFrames'
                    let readingFrames = sourced?.children?.[CHARACTER_BOOK_NODE_LABEL];
                    return combineLatest(readingFrames ? flattenTree<Observable<TextWordData[]>>(readingFrames) : [])
                }),
                map((v: TextWordData[][]) => {
                    return flatten(v);
                }),
                shareReplay(1)
            );

        let visibleOpenedBookData$: Observable<TextWordData[][]> = combineLatest([
            this.renderedSentenceTextDataTree$.updates$,
            config.bottomNavigationValue$
        ]).pipe(
            switchMap(([{sourced}, bottomNavigationValue]) => {
                if (!sourced?.children) {
                    throw new Error("OpenedBooks has no tree, this should not happen")
                }
                switch (bottomNavigationValue) {
                    case NavigationPages.READING_PAGE:
                        let child = sourced.children[READING_BOOK_NODE_LABEL];
                        return combineLatest(child ? flattenTree(child) : []);
                    case NavigationPages.QUIZ_PAGE:
                        let child1 = sourced.children[CHARACTER_BOOK_NODE_LABEL];
                        return combineLatest(child1 ? flattenTree(child1) : []);
                    default:
                        return combineLatest([]);
                }
            }),
            shareReplay(1)
        );

        this.visibleElements$ = visibleOpenedBookData$.pipe(
            map(flatten),
            map(sentenceData =>
                mergeDictArrays(...sentenceData.map(sentenceDatum => sentenceDatum.wordElementsMap))
            ),
            shareReplay(1)
        );

        this.sourceBooks$.pipe(
            switchMap(sourceBooks => combineLatest(Object.values(sourceBooks).map(sourceBook => sourceBook.children$))),
            withLatestFrom(this.readingBook$.pipe(startWith(undefined)))
        ).subscribe(([openSourceBooks, readingBook]) => {
            let openBooks = flatten(openSourceBooks.map(openSourceBookChildren => Object.values(openSourceBookChildren)));
            if (!readingBook && openBooks.length) {
                this.readingBook$.next(openBooks[0]);
            }
        });

        this.readingDocument$ = this.readingBook$.pipe(
            switchMap(readingBook => {
                if (!readingBook) return of<AtomizedDocument>();
                return readingBook.atomizedDocument$;
            }),
            shareReplay(1)
        )
        this.readingBook = new OpenBook(
            "Reading Book",
            config.trie$,
            this.readingDocument$,
            undefined,
            config.applyAtomizedSentencesListener
        );
        this.openedBooks.appendDelta$.next(
            {
                nodeLabel: 'root',
                children: {
                    [READING_BOOK_NODE_LABEL]: {
                        nodeLabel: READING_BOOK_NODE_LABEL,
                        children: {
                            [this.readingBook.name]: {
                                nodeLabel: this.readingBook.name,
                                value: this.readingBook
                            }
                        }
                    }
                }
            }
        )

    }

    private applyListenersToOpenedBookBodies() {
        this.openedBooks.updates$.subscribe(({delta}) => {
            flattenTree(delta).forEach(newOpenedBook => newOpenedBook.renderRoot$.subscribe(root => this.config.applyListeners(root.ownerDocument as HTMLDocument)))
        })
    }
}