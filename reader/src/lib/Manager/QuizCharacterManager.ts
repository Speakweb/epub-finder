import {Observable, ReplaySubject} from "rxjs";
import {AtomizedSentence} from "../Atomized/AtomizedSentence";
import {OpenBook} from "../BookFrame/OpenBook";
import {ds_Dict} from "../Util/DeltaScanner";
import {ICard} from "../Interfaces/ICard";
import {distinct, map} from "rxjs/operators";
import {TrieObservable} from "../AppContext/NewOpenBook";

export const EMPTY_SRC = (src: string = '') => `

<head>
<title>QuizCharactePageFrame</title>
</head>
<body>
<div>
${src}
</div>
</body>
`

function interpolateSourceDoc(sentences: string[]) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Example Sentences</title>
</head>
<body>
${sentences.map(sentence => {
        return `<div>${sentence}</div>`;
    }).join('</br>')}
</body>
</html>
        `;
}

export interface QuizCharacterManagerParams {
    exampleSentences$: Observable<AtomizedSentence[]>,
    quizzingCard$: Observable<ICard | undefined>;
    trie$: TrieObservable;
    requestPlayAudio: (sentence: string) => void
}

export class QuizCharacterManager {
    exampleSentences$: Observable<AtomizedSentence[]>;
    quizzingCard$: Observable<ICard | undefined>;
    atomizedSentenceMap$ = new ReplaySubject<ds_Dict<AtomizedSentence>>(1);
    public exampleSentencesFrame: OpenBook;

    private sentenceCache = new Set<string>();

    constructor({
                    exampleSentences$,
                    quizzingCard$,
                    trie$,
        requestPlayAudio
                }: QuizCharacterManagerParams) {
        this.exampleSentences$ = exampleSentences$;
        this.quizzingCard$ = quizzingCard$;
        this.exampleSentencesFrame = new OpenBook(
            'ExampleSentences',
            trie$,
        );
        this.exampleSentences$.pipe(
            map(sentences => {
                let s = interpolateSourceDoc(sentences.map(sentence => {
                    let translatableText = sentence.translatableText;
                    if (!this.sentenceCache.has(translatableText)) {
                        requestPlayAudio(translatableText);
                    }
                    this.sentenceCache.add(translatableText);
                    return translatableText;
                }));
/*
                if (sentences.length) {
                    debugger;console.log();
                }
*/
                return s;
            }),
        ).subscribe(this.exampleSentencesFrame.unAtomizedSrcDoc$);

        this.quizzingCard$.pipe(
            distinct(card => card?.learningLanguage)
        ).subscribe(() => {
            this.sentenceCache.clear();
        })
        /**
         * If we have a learningLanguage, and have less than 10 sentences
         * I want to hear about deltas in the sentenceMap about my word to see if there are new ones
         */
        /*
                obs$.subscribe(args => {
                    console.log();
                })
        */
        /*
                this.exampleSentences$.obs$.pipe(
                    withLatestFrom(
                        this.bookFrame.frame.iframe$,
                        this.atomizedSentenceMap$
                    ),
                    scan((
                        currentExampleSentenceElements: ds_Dict<string>,
                        [{ delta}, {body, iframe}, atomizedSentenceMap],
                    ) => {
                        const doc = new AtomizedDocument(body.ownerDocument as XMLDocument);
                        const v = getDeletedValues(delta);
                        Object.keys(delta.remove || {}).forEach(sentenceToRemove => {
                            atomizedSentenceMap[sentenceToRemove].destroy();
                            delete atomizedSentenceMap[sentenceToRemove];
                        })
                        Object.keys(delta.set || {}).forEach((sentenceToAdd: string) => {
                            atomizedSentenceMap[sentenceToAdd] = new AtomizedSentence(
                                doc.appendRehydratableText(sentenceToAdd)
                            );
                        });
                        return currentExampleSentenceElements;
                    }, {})
                ).subscribe(() => {
                    // HACK, because I want the side effects of my scan
                });

        */
    }
}