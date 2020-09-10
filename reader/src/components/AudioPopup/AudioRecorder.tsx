import {makeStyles} from "@material-ui/core/styles";
import React, {useRef, useState} from "react";
import { Card,  CardContent,  Typography} from "@material-ui/core";
import {Manager} from "../../lib/Manager";
import CountdownCircle from "./CountdownCircle";
import {lookupPinyin} from "../../lib/ReactiveClasses/EditingCard";
import {TutorialPopper} from "../Popover/Tutorial";
import {useObservableState} from "observable-hooks";

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

export const SLIM_CARD_CONTENT = {display: 'flex', flexFlow: 'row nowrap', paddingTop: '5px', paddingBottom: 0, paddingLeft: '5px'};

export default function AudioRecorder({m}: { m: Manager }) {
    const classes = useStyles();
    const r = m.audioManager.audioRecorder;
    /*
        const userAudio = useObservableState(r.userAudio$);
    */
    const synthAudio = useObservableState(m.audioManager.currentSynthesizedAudio$);
    /*
        const graphData = useObs<number[][]>(m.audioManager.lineupGraphs$)
    */
    const canvasRef = useRef<HTMLCanvasElement>();
    const recognizedText = useObservableState(r.audioSource.mostRecentRecognizedText$);
    const currentAudioRequest = useObservableState(r.recordRequest$)// Maybe pipe this to make it a replaySubject?

    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

    return <div className={classes.popupParent} ref={setReferenceElement}>
        <Card className={'grow-from-one-line'}>
            <CardContent style={{display: 'flex', flexFlow: 'column nowrap', paddingTop: '5px', paddingBottom: 0, paddingLeft: '5px'}}>
                <TutorialPopper referenceElement={referenceElement} storageKey={'AUDIO_POPUP'} placement="top">
                    <Typography variant="subtitle2">Test your pronunciation by speaking when the light is green. The
                        recognized text should match the pinyin on the flashcard.</Typography>
                </TutorialPopper>
                <div style={{display: 'grid', gridTemplateColumns: '10% 90%'}}>
                    <CountdownCircle r={r}/>
                    <div style={{display: 'flex', flexFlow: 'row nowrap', justifyContent: 'space-around'}}>
                        <span style={{flexGrow: 1}}>
                        <Typography variant="h6" className={classes.learningLanguage}
                                    align="center">{currentAudioRequest?.label}</Typography>
                        </span>
                        <audio style={{height: '24px', flexGrow: 1}} src={synthAudio?.url} controls autoPlay/>
                    </div>
                </div>
                <Typography variant="h6" >{recognizedText}</Typography>
                <Typography variant="h6" >{lookupPinyin(recognizedText || '').join(' ')}</Typography>
                {/*
                    <Grid item xs={6}>
                        <audio src={userAudio?.url} controls autoPlay />
                    </Grid>
*/}
                {/*
                {graphData && <MultiGraph plots={graphData}/>}
*/}
{/*
                <IconButton style={{height: '24px', width: '24px'}} disabled={} onClick={() => r.recordRequestRecording$.next(retryableAudioRequest)} aria-label="retry">
                    <RefreshIcon style={{height: '24px', width: '24px'}} />
                </IconButton>
*/}
            </CardContent>
        </Card>
    </div>
}