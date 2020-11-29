import CardService from "../Manager/CardService";
import {PronunciationProgressService} from "../schedule/pronunciation-progress.service";
import {WordRecognitionProgressService} from "../schedule/word-recognition-progress.service";

export class CardCreationService {
    constructor(
        {
            cardService,
            pronunciationProgressService,
            wordRecognitionService
        }: {
            cardService: CardService,
            pronunciationProgressService: PronunciationProgressService,
            wordRecognitionService: WordRecognitionProgressService,
        }) {
        function putWords(records: {word: string}[]) {
            cardService.putWords$.next(records.map(r => r.word));
        }
        pronunciationProgressService.addRecords$.subscribe(putWords);
        wordRecognitionService.addRecords$.subscribe(putWords);
    }
}