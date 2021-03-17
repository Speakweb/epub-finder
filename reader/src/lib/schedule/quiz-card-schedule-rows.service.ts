import {combineLatest, Observable} from "rxjs";
import {map, shareReplay, startWith} from "rxjs/operators";
import {ds_Dict} from "../delta-scan/delta-scan.module";
import {IndexedRowsRepository} from "./indexed-rows.repository";
import {WordRecognitionRow} from "./word-recognition-row";
import {PronunciationProgressRepository} from "./pronunciation-progress.repository";
import CardsRepository from "../manager/cards.repository";
import {IgnoredWordsRepository} from "./ignored-words.repository";
import {NormalizedQuizCardScheduleRowData, ScheduleRow, QuizScheduleRowData} from "./schedule-row";
import {ScheduleMathService, sumWordCountRecords} from "./schedule-math.service";
import {SettingsService} from "../../services/settings.service";
import {AllWordsRepository} from "../all-words.repository";
import {OpenDocumentsService} from "../manager/open-documents.service";

export class QuizCardScheduleRowsService {
    public indexedScheduleRows$: Observable<ds_Dict<ScheduleRow<NormalizedQuizCardScheduleRowData>>>;

    constructor({
                    wordRecognitionProgressService,
                    openDocumentsService,
                    pronunciationProgressService,
                    cardsRepository,
                    ignoredWordsRepository,
                    settingsService,
                    allWordsRepository,
                }: {
        wordRecognitionProgressService: IndexedRowsRepository<WordRecognitionRow>,
        pronunciationProgressService: PronunciationProgressRepository
        openDocumentsService: OpenDocumentsService
        cardsRepository: CardsRepository,
        ignoredWordsRepository: IgnoredWordsRepository,
        settingsService: SettingsService,
        allWordsRepository: AllWordsRepository
    }) {
        const progress$ = combineLatest([
            wordRecognitionProgressService.indexOfOrderedRecords$.pipe(startWith({})),
            pronunciationProgressService.indexOfOrderedRecords$,
        ])
        this.indexedScheduleRows$ = combineLatest([
            progress$,
            openDocumentsService.virtualDocumentTabulation$,
            cardsRepository.cardIndex$,
            ignoredWordsRepository.latestRecords$,
            combineLatest([
                settingsService.frequencyWeight$,
                settingsService.dateWeight$,
                settingsService.wordLengthWeight$
            ]),
            allWordsRepository.all$,
        ]).pipe(
            map(([
                     [wordRecognitionRowIndex, pronunciationRowIndex],
                     wordCounts,
                     cardIndex,
                     ignoredWords,
                     [frequencyWeight, dateWeight, wordLengthWeight],
                     allWords
                 ]) => {
                const scheduleRows: ds_Dict<QuizScheduleRowData> = {};
                const ensureScheduleRow = (word: string) => {
                    if (!scheduleRows[word]) {
                        scheduleRows[word] = {
                            wordCountRecords: [],
                            word,
                            wordRecognitionRecords: [],
                            pronunciationRecords: [],
                            greedyWordCountRecords: []
                        } as QuizScheduleRowData;
                    }
                    return scheduleRows[word];
                };

                allWords.forEach(word => {
                    ensureScheduleRow(word)
                })
                wordCounts.serializedTabulations.forEach(({documentWordCounts}) => {
                    /**
                     * Prevent cards created only for visual purposes from showing up in the quiz rows
                     */
                    Object.entries(documentWordCounts).forEach(([word, wordCountRecords]) => {
                        if (scheduleRows[word]) {
                            scheduleRows[word].wordCountRecords.push(...wordCountRecords)
                        }
                    });
                })

                Object.entries(pronunciationRowIndex).forEach(([word, pronunciationRecords]) => {
                    if (scheduleRows[word]) {
                        scheduleRows[word].pronunciationRecords.push(...pronunciationRecords);
                    }
                });
                Object.entries(wordRecognitionRowIndex).forEach(([word, wordRecognitionRecords]) => {
                    scheduleRows[word]?.wordRecognitionRecords.push(...wordRecognitionRecords);
                });
                ignoredWords.forEach(({word}) => delete scheduleRows[word]);
                return Object.fromEntries(ScheduleMathService.normalizeAndSortQuizScheduleRows(
                    {
                        dueDate: {
                            fn: (row: ScheduleRow<QuizScheduleRowData>) => row.dueDate().getTime() * -1,
                            weight: dateWeight
                        },
                        count: {
                            fn: (row: ScheduleRow<QuizScheduleRowData>) => sumWordCountRecords(row),
                            weight: frequencyWeight,
                        },
                        length: {
                            fn: (row: ScheduleRow<QuizScheduleRowData>) => row.d.word.length,
                            weight: wordLengthWeight
                        },
                    },
                    Object.values(scheduleRows)
                        .map(r => new ScheduleRow<QuizScheduleRowData>(r, r.wordRecognitionRecords)),
                    (sortValues, sortConfigs) => {
                        return {
                            dueDate: sortValues[0],
                            count: sortValues[1],
                            length: sortValues[2]
                        }
                    }
                ).map(row => [
                    row.row.d.word,
                    new ScheduleRow<NormalizedQuizCardScheduleRowData>(
                        {
                            ...row.row.d,
                            ...row.sortValues,
                            finalSortValue: row.finalSortValue,
                            normalizedCount: row.sortValues.count.normalizedValueObject,
                            normalizedDate: row.sortValues.dueDate.normalizedValueObject
                        },
                        row.row.d.wordRecognitionRecords
                    )
                ]))
            }),
            shareReplay(1)
        );
    }


}