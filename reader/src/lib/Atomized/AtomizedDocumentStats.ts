import {Dictionary} from "lodash";
import {AtomizedSentence} from "./AtomizedSentence";
import {ds_Dict} from "../Tree/DeltaScanner";
import {BookWordCount} from "../Interfaces/BookWordCount";

export interface AtomizedDocumentStats {
    wordCounts: Dictionary<number>;
    wordSentenceMap: Dictionary<AtomizedSentence[]>;
    text: string;
    head: string;
    body: string;
}

export interface AtomizedDocumentBookStats extends AtomizedDocumentStats {
    documentWordCounts: ds_Dict<BookWordCount>;
}
