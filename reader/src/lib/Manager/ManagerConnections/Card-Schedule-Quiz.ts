import {ScheduleService} from "../schedule.service";
import {QuizManager} from "../QuizManager";
import CardsRepositoryService from "../cards.repository.service";

export function CardScheduleQuiz(c: CardsRepositoryService, s: ScheduleService, q: QuizManager) {
/*
    let nextCardToQuiz$ = s.nextWordToQuiz$.pipe(
        startWith(undefined),
        resolveICardForWord<string | undefined, ICard | undefined>(c.cardIndex$),
        shareReplay(1),
    );
    q.quizzingCard$.pipe(withLatestFrom(nextCardToQuiz$)).subscribe(([currentQuizItem, nextCardToQuiz]) => {
        if (!currentQuizItem && nextCardToQuiz) {
            q.setQuizItem(nextCardToQuiz);
        }
    });
*/
/*
    nextCardToQuiz$.pipe(
        withLatestFrom(q.quizzingCard$.pipe(startWith(undefined)))
    ).subscribe(([nextCardToQuiz, currentQuizItem]) => {
        if (!currentQuizItem && nextCardToQuiz) {
            q.setQuizItem(nextCardToQuiz);
        }
    });
*/

/*
    q.scheduledCards$.addObservable$.next(
        s.wordQuizList$.pipe(
            resolveICardForWords(c.cardIndex$),
        )
    );
    q.scheduledCards$.obs$.subscribe(args => {
        console.log();
    })
*/
}