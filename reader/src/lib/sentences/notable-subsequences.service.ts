import { PronunciationProgressRepository } from '../schedule/pronunciation-progress.repository'
import { WordRecognitionProgressRepository } from '../schedule/word-recognition-progress.repository'
import { SetWithUniqueLengths } from "@shared/"
import { combineLatest, Observable } from 'rxjs'
import { distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators'
import { TemporaryHighlightService } from '../highlighting/temporary-highlight.service'
import { VideoMetadataRepository } from '../../services/video-metadata.repository'
import { WordsService } from '../language/words.service'
import { LanguageConfigsService } from '../language/language-configs.service'

export class NotableSubsequencesService {
    notableSubsequenceSet$: Observable<SetWithUniqueLengths>

    constructor({
        pronunciationProgressService,
        wordRecognitionProgressRepository,
        temporaryHighlightService,
        videoMetadataRepository,
        wordsService,
        languageConfigsService
    }: {
        pronunciationProgressService: PronunciationProgressRepository
        wordRecognitionProgressRepository: WordRecognitionProgressRepository
        temporaryHighlightService: TemporaryHighlightService
        videoMetadataRepository: VideoMetadataRepository
        wordsService: WordsService
        languageConfigsService: LanguageConfigsService
    }) {
        this.notableSubsequenceSet$ = combineLatest([
            pronunciationProgressService.indexOfOrderedRecords$,
            wordRecognitionProgressRepository.indexOfOrderedRecords$,
            temporaryHighlightService.temporaryHighlightRequests$.pipe(
                startWith(undefined),
            ),
            videoMetadataRepository.all$,
            wordsService.words$,
            languageConfigsService.readingLanguageCode$
        ]).pipe(
            map(
                ([
                    pronunciationRecords,
                    wordRecognitionRecords,
                    temporaryHighlightRequest,
                    videoMetadata,
                    words,
                    language_code
                ]) => {
                    const recognitionRecordsForCurrentLanguage = Object.values(wordRecognitionRecords)
                        .filter(recognitionRows => recognitionRows.find(r => r.language_code === language_code))
                        .map(recognitionRows => recognitionRows[0].word)
                    const strings = [
                        ...Object.keys(pronunciationRecords),
                        ...recognitionRecordsForCurrentLanguage,
                        ...videoMetadata.keys(),
                        ...words.values(),
                    ]
                    if (temporaryHighlightRequest) {
                        strings.push(temporaryHighlightRequest.word)
                    }
                    return new SetWithUniqueLengths(strings)
                },
            ),
            distinctUntilChanged((a, b) => Array(a).join('') === Array(b).join('')),
            shareReplay(1),
        )
    }
}
