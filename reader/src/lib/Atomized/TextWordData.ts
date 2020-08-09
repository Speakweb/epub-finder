import {Dictionary} from "lodash";
import {IAnnotatedCharacter} from "../Interfaces/Annotation/IAnnotatedCharacter";
import {AtomizedSentence} from "./AtomizedSentence";

export interface TextWordData {
    wordElementsMap: Dictionary<IAnnotatedCharacter[]>;
    wordCounts: Dictionary<number>;
    wordSentenceMap: Dictionary<AtomizedSentence[]>;
}

export function mergeSentenceInfo(...sentenceInfos: TextWordData[]): TextWordData {
    let aggSentenceInfo = sentenceInfos[0];
    for (let i = 1; i < sentenceInfos.length; i++) {
        const newSentenceInfo = sentenceInfos[i];
        Object.entries(newSentenceInfo.wordCounts).forEach(([key, val]) => {
            if (!aggSentenceInfo .wordCounts[key]) {
                aggSentenceInfo .wordCounts[key] = 0;
            }
            aggSentenceInfo.wordCounts[key] += val
        });

        for (let key in newSentenceInfo.wordElementsMap) {
            if (aggSentenceInfo.wordElementsMap[key]) {
                aggSentenceInfo.wordElementsMap[key].push(...newSentenceInfo.wordElementsMap[key]);
            } else {
                aggSentenceInfo.wordElementsMap[key] = newSentenceInfo.wordElementsMap[key]
            }
        }

        // TODO isolate this pattern
        for (let key in newSentenceInfo.wordSentenceMap) {
            if (aggSentenceInfo.wordSentenceMap[key]) {
                aggSentenceInfo.wordSentenceMap[key].push(...newSentenceInfo.wordSentenceMap[key]);
            } else {
                aggSentenceInfo.wordSentenceMap[key] = newSentenceInfo.wordSentenceMap[key]
            }
        }
    }
    return aggSentenceInfo;
}