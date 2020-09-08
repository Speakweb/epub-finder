import {Observable, ReplaySubject, Subject} from "rxjs";
import {ICard} from "../Interfaces/ICard";
import {Characters} from "../../components/Quiz/Characters";
import { startWith, withLatestFrom} from "rxjs/operators";
import {Pictures} from "../../components/Quiz/Pictures";
import {Conclusion} from "../../components/Quiz/Conclusion";
import {sleep} from "../Util/Util";

export interface QuizResult {
    word: string;
    score: number;
}

export type QuizComponent = string;

export interface QuizManagerParams {
    scheduledCards$: Observable<ICard[]>;
    requestHighlightedWord: (s: string) => void
}

export class QuizManager {
    quizzingCard$ = new ReplaySubject<ICard | undefined>(1);
    quizzingComponent$ = new ReplaySubject<QuizComponent>(1);
    quizResult$ = new Subject<QuizResult>();
    advanceQuizStage$ = new Subject();

    scheduledCards$: Observable<ICard[]>;

    requestNextCard$ = new Subject<void>();

    constructor({scheduledCards$, requestHighlightedWord}: QuizManagerParams) {
        this.scheduledCards$ = scheduledCards$;
        this.quizzingCard$.subscribe(() => {
            console.log();
        })
        this.quizzingCard$.pipe(
            startWith(undefined),
            withLatestFrom(this.scheduledCards$)
        ).subscribe(async ([quizzingCard, scheduledCards]: [ICard | undefined, ICard[]]) => {
            if (!quizzingCard && scheduledCards[0]) {
                this.requestNextCard$.next();
            }
        });

        this.requestNextCard$.pipe(
            withLatestFrom(this.scheduledCards$)
        ).subscribe(async ([_, scheduledCards]) => {
            let iCard = scheduledCards[0];
            this.quizzingCard$.next(iCard);
            this.quizzingComponent$.next("Characters");
            await sleep(1000);
            requestHighlightedWord(iCard.learningLanguage)
        })

/*
        combineLatest([
            this.quizzingCard$.pipe(startWith(undefined)),
            this.requestNextCard$.pipe(
                debounceTime(1)
            )
        ]).subscribe(([quizzingCard, setQuizItem]) => {
            if(!quizzingCard && setQuizItem) {
                this.requestNextCard$.next();
            }
        })
*/

        this.scheduledCards$.pipe(
            withLatestFrom(
                this.quizzingCard$.pipe(
                    startWith(undefined),
                )
            ),
        ).subscribe(([scheduledCards, quizzingCard]) => {
            if (!quizzingCard && scheduledCards[0]) {
                this.requestNextCard$.next();
            }
        })

        this.advanceQuizStage$.pipe(
            withLatestFrom(this.quizzingComponent$)
        ).subscribe(([, currentDialogComponent]) => {
            switch (currentDialogComponent) {
                case "Characters":
                    this.quizzingComponent$.next("Pictures")
                    break;
                case "Pictures":
                    this.quizzingComponent$.next("Conclusion")
                    break;
            }
        })
    }

    setQuizCard(icard: ICard | undefined) {
        this.quizzingCard$.next(icard);
        this.quizzingComponent$.next("Characters")
    }

    completeQuiz(word: string, recognitionScore: number) {
        this.quizResult$.next({
            score: recognitionScore,
            word
        });
        this.requestNextCard$.next()
    }

}