/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
import AtomizeSrcdoc from 'Worker-loader?name=dist/[name].js!../../lib/Worker/AtomizeSrcdoc';
import {Card, CardActions, CardContent} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import React, {useEffect, useState} from "react";
import {QuizCardProps} from "./Popup";
import {Pictures} from "./Pictures";
import {quizStyles} from "./QuizStyles";
import {combineLatest, Observable} from "rxjs";
import QuizStatsHeader from "./QuizStatsHeaders";
import {filter, map, switchMap, take, tap, withLatestFrom} from "rxjs/operators";
import {useObservable, useObservableState} from "observable-hooks";
import {PageRenderer} from "../../lib/PageRenderer";
import {AtomizedFrameContainer} from "../Atomized/AtomizedFrameContainer";
import {InputManager} from "../../lib/Manager/InputManager";
import {GetWorkerResults} from "../../lib/Util/GetWorkerResults";
import {Dictionary, uniq} from "lodash";
import {AtomizedSentence} from "../../lib/Atomized/AtomizedSentence";
import {IAnnotatedCharacter} from "../../lib/Interfaces/Annotation/IAnnotatedCharacter";
import {PageManager} from "../../lib/Manager/PageManager";
import {TrieWrapper} from "../../lib/TrieWrapper";


function getSrc(sentences: string[]) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Random Title</title>
</head>
<body>
${sentences.map(sentence => {
        return `<div>${sentence}</div>`;
    })}
</body>
</html>
        `;
}

export function Characters({c, m}: QuizCardProps) {
    const advance = () => m.quizManager.quizzingComponent$.next("Pictures");
    const classes = quizStyles();
    const [error, setError] = useState('');
    const sentences$ = useObservableState(useObservable<string[], [string | undefined]>(
        (obs$: Observable<[string | undefined]>) =>
            obs$.pipe(
                withLatestFrom(m.textData$),
                map(([[word], {wordSentenceMap}]) =>
                    (wordSentenceMap[word || ''] || []).map((s: AtomizedSentence) => s.translatableText)
                )
            )
        , [c?.learningLanguage],
    ), []);

    const pageRenderer$ = useObservableState(useObservable((obs$: Observable<[string[]]>) =>
        obs$.pipe(
            map(([sentences]) => getSrc(sentences)),
            switchMap(async (src: string) => {
                const atomizedSrc = await GetWorkerResults(new AtomizeSrcdoc(), src);
                return new PageRenderer(atomizedSrc, 'character_translation');
            })
        ), [sentences$])
    );

    useObservableState(useObservable((obs$: Observable<[PageRenderer | undefined]>) =>
        obs$.pipe(
            filter(([pageRenderer]) => !!pageRenderer),
            switchMap(([pageRenderer]: [PageRenderer | undefined]) => (pageRenderer as PageRenderer).iframebody$),
            tap(iframeBody => {
                m.inputManager.applyListeners(iframeBody);
            })
        ), [pageRenderer$]),
    );
    const atomizedSentences = useObservableState(useObservable((obs$: Observable<[PageRenderer | undefined]>) =>
            combineLatest(
                [
                    obs$.pipe(
                        filter(([pageRenderer]) => !!pageRenderer),
                        switchMap(([pageRenderer]) => (pageRenderer as PageRenderer).atomizedSentences$
                            .pipe(
                                filter(atomizedSentences => atomizedSentences.length > 0)
                            )
                        )
                    ),
                    m.cardManager.trie$
                ]
            ).pipe(
                tap(([atomizedSentences, trie]) => {
                    PageManager.ApplyAtomizedSentenceListeners(atomizedSentences);
                    atomizedSentences.forEach(atomizeSentence => {
                        InputManager.applySentenceElementSelectListener(atomizeSentence);
                    });
                    const textWordData = AtomizedSentence.getTextWordData(
                        atomizedSentences,
                        trie,
                        uniq(trie.getWords(false).map(v => v.length))
                    );
                    m.characterPageWordElementMap$.next(textWordData.wordElementsMap)
                })
            )
        , [pageRenderer$])
    );

    useEffect(() => {
        setError("");// The card has changed, clear the error message
        if (!c) return;
        m.audioManager.audioRecorder.quedRecordRequest$.next({
            duration: 1,
            cb: async (createdSentence: string) => {
                if (!createdSentence) {
                    return;
                }
                if (!createdSentence.includes(c.learningLanguage)) {
                    setError(`The synthesized sentence (${createdSentence}) does not contain ${c.learningLanguage}`)
                }
                const allPreviousCreatedSentence = await m.createdSentenceManager.allCreatedSentences$.pipe(
                    take(1),
                ).toPromise();

                if (allPreviousCreatedSentence[createdSentence]) {
                    setError(`You have already said ${createdSentence}`)
                } else {
                    setError('');
                    m.createdSentenceManager
                        .addUnpersistedCreatedSentence$
                        .next([{learningLanguage: createdSentence}])
                    advance();
                }
            },
            label: c?.learningLanguage,
        })
    }, [c])
    return <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
            {error}
            <div>
                <Typography variant="h1" component="h1" className={classes.center}>
                    {c?.learningLanguage}
                </Typography>
            </div>
            <div style={{flexGrow: 1, width: '100%'}}>
                {pageRenderer$ && <AtomizedFrameContainer rb={pageRenderer$} m={m}/>}
            </div>
        </CardContent>
        <CardActions className={classes.cardActions}>
            <QuizStatsHeader m={m}/>
            <Button onClick={advance}>Next</Button>
        </CardActions>
    </Card>
}