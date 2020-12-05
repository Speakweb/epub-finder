import {constructTree, ds_Tree} from "../../services/tree.service";
import React from "react";
import {Manager} from "../../lib/Manager";
import {Reading} from "../Reading/Reading";
import {TreeMenuNode} from "../../services/tree-menu-node.interface";
import {combineLatest, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {useObservableState} from "observable-hooks";
import {orderBy} from "lodash";
import {SentenceMetadata} from "../../services/video-metadata.service";
import {ModeDirectory} from "./mode-directory.service";
import {LibraryDirectoryService} from "./library-directory.service";
import {EditableHotkeys, HotkeyDirectoryService} from "./hotkey-directory.service";
import {PlaybackSpeedComponent} from "./playback-speed.component";
import {HotKeyEvents} from "../../lib/HotKeyEvents";
import {VideoMetadata} from "../PronunciationVideo/video-meta-data.interface";

const DEVELOPER_MODE = localStorage.getItem("DEVELOPER_MODE");

export const menuNodeFactory = (
    Component: React.FunctionComponent | undefined,
    label: string,
    key: string,
    moveDirectory: boolean,
    LeftIcon?: React.Component,
    inlineComponent?: React.FunctionComponent,
    component?: React.FunctionComponent,
    action?: () => void
): TreeMenuNode => ({
    Component,
    name: key,
    label,
    LeftIcon: LeftIcon,
    moveDirectory,
    action
});


export const AllSentences: React.FC<{ m: Manager }> = ({m}) => {
    const allSentences = useObservableState(m.videoMetadataService.allSentenceMetadata$, []);

    return <div className={'all-sentences'}>
        {allSentences.map(sentenceMetadata => <Sentence key={sentenceMetadata.sentence}
                                                        sentenceMetadata$={sentenceMetadata.metadata$}
                                                        sentence={sentenceMetadata.sentence}/>)}
    </div>
}

export const Sentence: React.FC<{ sentenceMetadata$: Observable<VideoMetadata>, sentence: string }> = ({sentence, sentenceMetadata$}) => {
    const metadata = useObservableState(sentenceMetadata$);
    return <div style={{backgroundColor: metadata ? 'white' : 'pink'}}>
        {sentence}
    </div>
}


export const AppDirectoryService = (m: Manager): Observable<ds_Tree<TreeMenuNode>> => {
    // This is going to break the way I do "Selected components".
    // I should do selected components by path, that way their refs can change?
    // Also I gotta make sure all my values are unique in that loop
    return combineLatest([
        m.library.customBooks$.dict$,
        m.settingsService.checkedOutBooks$,
        m.library.builtInBooks$.dict$
    ]).pipe(
        map(([
                 customBooks,
                 checkedOutBooks,
                 builtInBooks
             ]) => {
            const ReadingComponent = () => <Reading m={m}/>;
            const main = menuNodeFactory(ReadingComponent, 'Reading', 'root', false);
            /*
                        const reading = menuNodeFactory(ReadingComponent, 'Reading', 'reading', true);
            */


            const rootTree = constructTree('root', main);
            rootTree.children = {
                ...ModeDirectory(m),
                /*
                                reading: constructTree('reading', reading),
                */
                library: LibraryDirectoryService(m, checkedOutBooks, {...customBooks, ...builtInBooks}),
                hotkeys: HotkeyDirectoryService(m),
                playbackSpeed: {
                    nodeLabel: 'playbackSpeed',
                    value: {
                        name: 'playbackSpeed',
                        label: 'playbackSpeed',
                        InlineComponent: () => <PlaybackSpeedComponent/>
                    },
                }
            };
            if (DEVELOPER_MODE) {
                rootTree.children.AllSentences = constructTree(
                    'AllSentences',
                    menuNodeFactory(() => <AllSentences m={m}/>, 'AllSentences', 'AllSentences', false)
                )
            }
            return rootTree;
        })
    )
}