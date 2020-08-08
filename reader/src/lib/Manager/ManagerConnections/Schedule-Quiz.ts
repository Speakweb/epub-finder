import {ScheduleManager} from "../ScheduleManager";
import {QuizManager} from "../QuizManager";
import {QuizResultToRecognitionRow} from "../../Pipes/QuizResultToRecognitionRow";

export function ScheduleQuiz(s: ScheduleManager, q: QuizManager) {
    q.quizResult$.pipe(
        QuizResultToRecognitionRow(s.wordScheduleRowDict$, s.ms)
    ).subscribe(s.addUnpersistedWordRecognitionRows$);
}