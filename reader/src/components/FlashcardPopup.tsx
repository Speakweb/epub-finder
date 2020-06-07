import {Card} from "../lib/worker-safe/Card";
import React, {useEffect, useState} from "react";
import {Manager} from "../managers/Manager";
import {EditingCard, EditingCardClass} from "../AppSingleton";
import {ICard} from "../lib/worker-safe/icard";

export function FlashcardPopup({text, card, getImages, m}: { text: string, card: ICard, getImages: ((s: string) => Promise<string[]>) | undefined, m: Manager }) {
    const [clicked, setClicked] = useState(false)
    const [insidePopup, setInsidePopup] = useState(false)
    const [srces, setSrces] = useState<string[]>([]);
    useEffect(() => {
        if (getImages) {
            getImages(card.characters).then((data) => {
                setSrces(data);
            })
        }
    }, [])
    return <span style={{
        fontSize: "200%",
        zIndex: 99,
        font: ' Tahoma, Helvetica, Arial, "Microsoft Yahei","微软雅黑", STXihei, "华文细黑", sans-serif',
    }}
                 onClick={() => {
                     setClicked(true);
                     m.cardInEditor$.next(EditingCard.fromICard(card))
                 }}
                 onMouseLeave={() => setClicked(false)}
    >
        {(clicked || insidePopup) && false &&  <div
            style={{
                position: 'absolute',
            }}
            onMouseEnter={() => setInsidePopup(true)}
            onMouseLeave={() => setInsidePopup(false)}>
            {srces.map(s => <img key={s} src={s} style={{width: '100px', height: '100px'}}/>)}
            <div dangerouslySetInnerHTML={{__html: card.fields.join('</br>')}}>
            </div>
        </div>}
        {text}
    </span>
}