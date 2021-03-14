import {InterpolateService} from "../interpolate.service";
import {AtomizedDocument} from "./atomized-document";
import {TabulateService} from "../../documents/similarity/tabulate.service";
import trie from "trie-prefix-tree";
import {Segment} from "./segment";
import {ChineseVocabService} from "./chinese-vocab.service";

export const TabulateChineseText = async (text: string) => {
    const notableCharacterSequencesSegmentsGreedyWordSet = trie(await ChineseVocabService.vocab());
    return Segment.tabulate(
        {
            notableCharacterSequences: notableCharacterSequencesSegmentsGreedyWordSet,
            segments: AtomizedDocument.atomizeDocument(InterpolateService.text(text)).segments(),
            greedyWordSet: notableCharacterSequencesSegmentsGreedyWordSet
        }

    )

}