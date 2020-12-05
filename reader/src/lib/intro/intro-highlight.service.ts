import {Observable} from "rxjs";
import {AtomizedSentence} from "../Atomized/AtomizedSentence";
import {ds_Dict} from "../Tree/DeltaScanner";
import {filter, map, take} from "rxjs/operators";
import {flatten} from "lodash";
import {TemporaryHighlightService} from "../Highlighting/temporary-highlight.service";
import {RandomColorsService} from "../../services/random-colors.service";
import {sleep} from "../Util/Util";

export class IntroHighlightService {
    constructor({atomizedSentences$, temporaryHighlightService}: {
        atomizedSentences$: Observable<ds_Dict<AtomizedSentence[]>>,
        temporaryHighlightService: TemporaryHighlightService,
    }) {
        atomizedSentences$.pipe(
            map(atomizedSentences => flatten(Object.values(atomizedSentences))),
            filter(atomizedSentences => atomizedSentences.length >= 10),
            take(1)
        ).subscribe(async atomizedSentences => {
            const allSentences = atomizedSentences.slice(0, 10).map(atomizedSentence => atomizedSentence.translatableText);

            function getRandomWords() {
                return allSentences.map(sentence => sentence.slice(...randomRange(0, sentence.length, 3)));
            }

            const randomWords = [...getRandomWords(), ...getRandomWords(), ...getRandomWords()]
            for (let i = 0; i < randomWords.length; i++) {
                const randomWord = randomWords[i];
                temporaryHighlightService.highlightTemporaryWord(randomWord, RandomColorsService.randomColor(), 1000);
                await sleep(10);
            }
        })
    }
}

const randomRange = (min: number, max: number, maxRangeSize: number): [number, number] => {
    const startRange = max - min;
    const start = (Math.random() * startRange) + min;
    const endRange = max - start;
    return [start, Math.min(Math.floor(start + (Math.random() * endRange) + 1), start + maxRangeSize)]
}
