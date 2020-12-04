import {Manager} from "../../lib/Manager";
import {TreeMenuNode} from "../../services/tree-menu-node.interface";
import {ds_Tree} from "../../services/tree.service";
import Highlight from '@material-ui/icons/Highlight';
import RecordVoiceOver from '@material-ui/icons/RecordVoiceOver';
import {Modes} from "../../lib/Modes/modes.service";
import React from "react";
import {PlayArrow} from "@material-ui/icons";
import {useObservableState} from "observable-hooks";
import {RecordRequest} from "../../lib/Interfaces/RecordRequest";
import {removePunctuation} from "../../lib/Highlighting/temporary-highlight.service";

export const ModeDirectory = (m: Manager): { [nodeLabel: string]: ds_Tree<TreeMenuNode> } => {
    const VideoSelect: React.FC = () => {
        const mode = useObservableState(m.modesService.mode$);
        if (mode === Modes.VIDEO) {
            return <PlayArrow htmlColor={'#3d5afe'}/>;
        }
        return <PlayArrow/>;
    }

    const HighlightMode: React.FC = () => {
        const mode = useObservableState(m.modesService.mode$);
        if (mode === Modes.HIGHLIGHT) {
            return <Highlight htmlColor={'#ccff00'}/>;
        }
        return <Highlight/>;
    }

    const SpeakMode: React.FC = () => {
        const isRecording = useObservableState(m.audioManager.audioRecorder.isRecording$)
        if (isRecording) {
            return <RecordVoiceOver htmlColor={'#CD0000'}/>;
        }
        return <RecordVoiceOver/>;
    }


    return Object.fromEntries(
        [
            ['Video', () => {
                m.modesService.mode$.next(
                    m.modesService.mode$.getValue() === Modes.VIDEO ?
                        Modes.NORMAL :
                        Modes.VIDEO
                );
            }, "Watch sentence", <VideoSelect/>],
            /*
                        ['Highlight', () => {
                            m.modesService.mode$.next(Modes.HIGHLIGHT);
                        }, "Highlight words", <HighlightMode/>],
            */
            [
                'Speaking', () => {
                const recordRequest = new RecordRequest(`Try reading one of the sentences below`);
                recordRequest.sentence.then(recognizedSentence => {
                    const word = removePunctuation(recognizedSentence);
                    m.pronunciationProgressService.addRecords$.next([{
                        word: word,
                        success: true
                    }]);
                    // Add a highlight for each of these characters
                    m.highlighter.createdCards$.next(word.split(' '));
                })
                m.audioManager.audioRecorder.recordRequest$.next(recordRequest)
            },
                "Test Pronunciation",
                <SpeakMode/>
            ]
        ].map(([name, label, Component]) => [
                name, {
                    nodeLabel: name,
                    value: {
                        name,
                        label,
                        Component
                    }
                }
            ]
        )
    )

}
