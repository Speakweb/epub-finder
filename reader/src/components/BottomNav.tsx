import {BottomNavigation, BottomNavigationAction} from "@material-ui/core";
import React, {useState} from "react";
import {Manager} from "../lib/Manager";
import {useObs} from "../lib/UseObs";

import ChromeReaderMode from '@material-ui/icons/ChromeReaderMode';
import School from '@material-ui/icons/School';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import Settings from '@material-ui/icons/Settings';
import {makeStyles} from "@material-ui/core/styles";
import CircularProgress from '@material-ui/core/CircularProgress';
import {NavigationPages} from "../lib/Util/Util";
import {TutorialPopper} from "./Tutorial/TutorialPopover";
import Typography from "@material-ui/core/Typography";
import CardContent from "@material-ui/core/CardContent";


const useStyles = makeStyles((theme) => ({
    bottomNav: {
        maxHeight: '10vh',
        minHeight: '10vh'
    }
}));


export function BottomNav({m}: { m: Manager }) {
    const item = useObs(m.bottomNavigationValue$)
    const classes = useStyles();
    const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
    return <BottomNavigation className={classes.bottomNav}
        value={item}
        onChange={(_, v) => m.bottomNavigationValue$.next(v)}
        ref={setReferenceElement}
    >
        <BottomNavigationAction label="Read" value={NavigationPages.READING_PAGE} icon={<ChromeReaderMode/>}/>
        <BottomNavigationAction label="Word Frequency" value={NavigationPages.TRENDS_PAGE} icon={<LibraryBooks/>}/>
        <BottomNavigationAction label="Quiz" value={NavigationPages.QUIZ_PAGE} icon={<School/>}/>
        <BottomNavigationAction label="Settings" value={NavigationPages.SETTINGS_PAGE} icon={<Settings/>}/>
        <TutorialPopper referenceElement={referenceElement} storageKey={'BOTTOM_NAV'} placement="bottom-start">
            <Typography variant="subtitle2">Welcome to the flashcard reader, click or highlight characters and words to get started.</Typography>
        </TutorialPopper>
    </BottomNavigation>;
}