import {Observable} from "rxjs";
import {Dictionary} from "lodash";
import {QuizResult} from "../manager/QuizManager";
import {map, withLatestFrom} from "rxjs/operators";
import {SrmService} from "../srm/srm.service";
import {ScheduleRow} from "../schedule/ScheduleRow";
import {WordRecognitionRow} from "../schedule/word-recognition-row";
import moment from "moment";

export const QuizResultToRecognitionRows =
    (
        scheduleRows$: Observable<Dictionary<ScheduleRow>>,
        ms: SrmService
    ) =>
        (obs$: Observable<QuizResult>) =>
            obs$.pipe(
                withLatestFrom(scheduleRows$),
                map(([scorePair, wordScheduleRowDict]): WordRecognitionRow => {
                    const previousRecords = wordScheduleRowDict[scorePair.word]?.d.wordRecognitionRecords || []
                    const nextRecognitionRecord = ms.getNextRecognitionRecord(
                        previousRecords,
                        scorePair.score,
                    );
                    return {
                        word: scorePair.word,
                        timestamp: new Date(),
                        ...nextRecognitionRecord,
                        nextDueDate: moment().add(nextRecognitionRecord.interval, 'day').toDate(),
                        grade: scorePair.score
                    };
                })
            )
