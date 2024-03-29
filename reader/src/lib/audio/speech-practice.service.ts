import { AudioRecorder } from './audio-recorder.service'
import { combineLatest, Observable } from 'rxjs'
import { LanguageConfigsService } from '../language/language-configs.service'
import { map, shareReplay, switchMap } from 'rxjs/operators'
import { fetchTransliteration } from '../language/transliterate.service'
import { fetchTranslationWithGrammarHints} from '../../services/translate.service'

export class SpeechPracticeService {
    public learningLanguage$: Observable<string | undefined>
    public romanization$: Observable<string | undefined>
    public translation$: Observable<string | undefined>

    constructor({
        audioRecorder,
        languageConfigsService,
    }: {
        audioRecorder: AudioRecorder
        languageConfigsService: LanguageConfigsService
    }) {
        this.learningLanguage$ = audioRecorder.currentRecognizedText$

        this.romanization$ = combineLatest([
            this.learningLanguage$,
            languageConfigsService.learningToLatinTransliterateFn$,
        ]).pipe(
            switchMap(async ([learningLanguageText, transliterateConfig]) => {
                if (transliterateConfig && learningLanguageText) {
                    return fetchTransliteration({
                        ...transliterateConfig,
                        text: learningLanguageText,
                    })
                }
            }),
            shareReplay(1),
        )
        this.translation$ = combineLatest([
            this.learningLanguage$,
            languageConfigsService.learningToKnownTranslateConfig$,
        ]).pipe(
            switchMap(async ([learningLanguageText, translateConfig]) => {
                if (translateConfig && learningLanguageText) {
                    return fetchTranslationWithGrammarHints({
                        ...translateConfig,
                        text: learningLanguageText,
                    })
                }
            }),
            shareReplay(1),
        )
    }
}
