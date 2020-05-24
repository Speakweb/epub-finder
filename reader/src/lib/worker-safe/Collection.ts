import {Card} from "./Card";
import {Dictionary, flattenDeep, zip, fromPairs} from "lodash";
import {Deck, SerializedDeck} from "./Deck";
import {Serializing, UnserializedAnkiPackage} from "./Serializing";

export class Collection {
    allCards: Card[];
    name: any;

    constructor(public decks: Deck[], name: string) {
        this.allCards = flattenDeep(decks.map(d => d.cards))
    }
    static fromSerialiazed(c: SerializedCollection) {
        return new Collection(c.decks.map(d => Deck.fromSerialized(d)), c.name)
    }
}


export class SerializedCollection {
    name: any;
    allCards: Card[]

    constructor(public decks: SerializedDeck[], name: string) {
        this.allCards = [];
    }
}

