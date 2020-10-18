import {makeStyles} from "@material-ui/core/styles";
import React, {useEffect, useRef, useState} from "react";
import {Card, CardContent, Paper, Typography} from "@material-ui/core";
import {Manager} from "../../lib/Manager";
import RecordingCircle from "./RecordingCircle";
import {lookupPinyin} from "../../lib/ReactiveClasses/EditingCard";
import {TutorialPopper} from "../Popover/Tutorial";
import {useObservableState} from "observable-hooks";
import {switchMap} from "rxjs/operators";
import {getTranslation} from "../../lib/Util/Util";

const useStyles = makeStyles((theme) => ({
    popupParent: {
        display: 'flex',
        flexFlow: 'column nowrap',
        backgroundColor: theme.palette.background.paper
    },
    titleRow: {
        display: 'flex',
        justifyContent: "center",
        height: 'fit-content'
    },
    learningLanguage: {
        flexGrow: 1
    },
}));

export const SLIM_CARD_CONTENT = {
    display: 'flex',
    flexFlow: 'row nowrap',
    paddingTop: '5px',
    paddingBottom: 0,
    paddingLeft: '5px'
};

export default function AudioRecorder({m}: { m: Manager }) {
    const classes = useStyles();
    const r = m.audioManager.audioRecorder;
    const synthAudio = useObservableState(m.audioManager.currentSynthesizedAudio$);
    const recognizedText = useObservableState(r.currentRecognizedText$);
    const translatedText = useObservableState(
        () => r.currentRecognizedText$.pipe(
            switchMap(text => text ? getTranslation(text) : Promise.resolve(''))
        ),
    )
    const currentAudioRequest = useObservableState(r.recordRequest$)// Maybe pipe this to make it a replaySubject?

    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

    return <div className={classes.popupParent} ref={setReferenceElement}>
        <Paper className={'audio-recorder-popup'} style={{
            display: 'flex',
            flexFlow: 'column nowrap',
            paddingTop: '5px',
            paddingBottom: 0,
            paddingLeft: '5px',
            position: 'relative',
            zIndex: 2,
        }}>
            <TutorialPopper referenceElement={referenceElement} storageKey={'AUDIO_POPUP'} placement="top">
                <Typography variant="subtitle2">Test your pronunciation by speaking when the light is green. The
                    recognized text should match the pinyin on the flashcard.</Typography>
            </TutorialPopper>
            <div style={{display: 'grid', gridTemplateColumns: '10% 90%'}}>
                <RecordingCircle r={r}/>
                <div style={{display: 'flex', flexFlow: 'row nowrap', justifyContent: 'space-around'}}>
                        <span style={{flexGrow: 1}}>
                        <Typography variant="h6"
                                    className={classes.learningLanguage}
                                    align="center"
                        >{currentAudioRequest?.label}</Typography>
                        </span>
                    <audio style={{height: '24px', flexGrow: 1}} src={synthAudio?.url} controls/>
                </div>
            </div>

        </Paper>
        {
            recognizedText && <Paper className={'recognized-text'}>
                <Typography variant="h6">{recognizedText}</Typography>
                <Typography variant="h6">{lookupPinyin(recognizedText || '').join(' ')}</Typography>
                <Typography variant="h6">{translatedText || ''}</Typography>
            </Paper>
        }
    </div>
}