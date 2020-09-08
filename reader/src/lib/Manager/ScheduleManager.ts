import {combineLatest, Observable, ReplaySubject, Subject} from "rxjs";
import {WordRecognitionRow} from "../Scheduling/WordRecognitionRow";
import {MyAppDatabase} from "../Storage/AppDB";
import {orderBy} from "lodash";
import {BookWordCount} from "../Interfaces/BookWordCount";
import {dueDate, isLearning, isNew, isToReview, ScheduleRow, wordCount} from "../ReactiveClasses/ScheduleRow";
import {filter, map, shareReplay, startWith, tap, withLatestFrom} from "rxjs/operators";
import {SRM} from "../Scheduling/SRM";
import {ds_Dict} from "../Util/DeltaScanner";
import {safePush} from "../../test/Util/GetGraphJson";

const DAY_IN_MINISECONDS = 24 * 60 * 60 * 1000;

const LEARNING_CARDS_LIMIT = 20;

function shuffle<T>(array: T[]): T[] {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

interface ScheduleManagerParams {
    wordCounts$: Observable<ds_Dict<BookWordCount[]>>,
    db: MyAppDatabase
}

export class ScheduleManager {
    wordQuizList$: Observable<ScheduleRow[]>;
    sortedScheduleRows$: Observable<ScheduleRow[]>;
    indexedScheduleRows$: Observable<ds_Dict<ScheduleRow>>;
    learningCards$: Observable<ScheduleRow[]>;
    wordRecognitionRecords$: ReplaySubject<ds_Dict<WordRecognitionRow[]>> = new ReplaySubject<ds_Dict<WordRecognitionRow[]>>(1);
    addWordRecognitionRecords$: Subject<WordRecognitionRow[]> = new Subject<WordRecognitionRow[]>();

    private today: number;
    private yesterday: number;
    ms: SRM;
    newCards$: Observable<ScheduleRow[]>;
    toReviewCards$: Observable<ScheduleRow[]>;
    private db: MyAppDatabase;

    constructor({db, wordCounts$}: ScheduleManagerParams) {
        this.db = db;
        this.today = Math.round(new Date().getTime() / DAY_IN_MINISECONDS);
        this.yesterday = this.today - 1;
        this.ms = new SRM();

        this.addWordRecognitionRecords$.pipe(
            filter(rows => !!rows.length),
            withLatestFrom(this.wordRecognitionRecords$.pipe(startWith({}))),
            tap(([rows, wordRecognitionRecords]: [WordRecognitionRow[], ds_Dict<WordRecognitionRow[]>]) => {
                rows.forEach(row => {
                    safePush(wordRecognitionRecords, row.word, row);
                    wordRecognitionRecords[row.word] = orderBy(wordRecognitionRecords[row.word], 'timestamp');
                });
                this.wordRecognitionRecords$.next(wordRecognitionRecords);
            }),
        ).subscribe((([rows]) => {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row.id) {
                    db.recognitionRecords.add(row).then(id => row.id = id);
                }
            }
        }));

        this.indexedScheduleRows$ = combineLatest([
            this.wordRecognitionRecords$.pipe(startWith({})),
            wordCounts$.pipe(startWith({}))
        ]).pipe(
            map(([wordRecognition, wordCounts]) => {
                const scheduleRows: ds_Dict<ScheduleRow> = {};
                function ensureScheduleRow(word: string) {
                    if (!scheduleRows[word]) {
                        scheduleRows[word] = {wordRecognitionRecords: [], wordCountRecords: [], word};
                    }
                    return scheduleRows[word];
                }
                Object.entries(wordCounts).forEach(([word, wordCountRecords]) => {
                    ensureScheduleRow(word).wordCountRecords.push(...wordCountRecords);
                });
                Object.entries(wordRecognition).forEach(([word, wordRecognitionRecords]) => {
                    scheduleRows[word]?.wordRecognitionRecords.push(...wordRecognitionRecords);
                });
                return scheduleRows;
            }),
            shareReplay(1)
        );

        this.sortedScheduleRows$ = this.indexedScheduleRows$.pipe(
            map(dict => {
                    return orderBy(Object.values(dict), ['dueDate', (row) => {
                        return wordCount(row);
                    }], ['asc', 'desc']);
                }
            ),
            shareReplay(1)
        )

        this.learningCards$ = this.sortedScheduleRows$.pipe(
            map(rows => rows.filter(row => isLearning(row))),
            shareReplay(1)
        )
        this.newCards$ = this.sortedScheduleRows$.pipe(
            map(rows => {
                return rows.filter(row => {
                    return isNew(row);
                });
            }),
            shareReplay(1)
        )
        this.toReviewCards$ = this.sortedScheduleRows$.pipe(
            map(rows => {
                return rows.filter(row => isToReview(row));
            }),
            shareReplay(1)
        )

        // First take from the learning
        // Second take from the overdue
        // Third take from the new

        this.wordQuizList$ = combineLatest([
            this.learningCards$,
            this.toReviewCards$,
            this.newCards$
        ]).pipe(
            map(([learningCards, toReviewCards, newCards]) => {
                    const learningCardsRequired = LEARNING_CARDS_LIMIT - (learningCards.length + toReviewCards.length);
                    if (learningCardsRequired > 0) {
                        let collection1 = [
                            ...learningCards,
                            ...toReviewCards,
                            ...(newCards.slice(0, learningCardsRequired) || [])
                        ];
                        return orderBy(collection1, r => {
                            return dueDate(r);
                        });
                    }
                let collection = [...learningCards, ...toReviewCards, ...newCards];
                return orderBy(collection, r => {
                    return dueDate(r);
                });
                }
            ),
            shareReplay(1)
        );

        this.loadRecognitionRows();
    }

    private async loadRecognitionRows() {
        const generator = this.db.getRecognitionRowsFromDB();
        for await (let rowChunk of generator) {
            this.addWordRecognitionRecords$.next(rowChunk);
        }
    }
}