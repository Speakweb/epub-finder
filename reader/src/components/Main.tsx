import {AppSingleton} from "../AppSingleton";
import {useObs} from "../UseObs";
import {RenderingBook} from "../lib/RenderingBook";
import React, {Fragment} from "react";
import {MessageList} from "./MessageLlist";
import {Grid} from "@material-ui/core";
import DebugDisplay from "./DebugDisplay";
import TopBar from "./TopBar";
import {Dictionary} from "lodash";
import LeftBar from "./LeftBar";
import {makeStyles} from "@material-ui/core/styles";
import {BookContainer} from "./BookContainer";
import {EditingCard} from "../lib/EditingCard";


const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        width: '100%',
        flexFlow: 'column nowrap',
        '& > *': {
            borderRadius: 0
        },
    },
}));

export function Main({s}: { s: AppSingleton }) {
    const {m} = s;
    const book = useObs<RenderingBook | undefined>(m.currentBook$)
    const currentPackage = useObs(m.currentPackage$);
    const packages = useObs(m.packages$, m.packages$.getValue());
    const editingCard = useObs<EditingCard | undefined>(m.cardInEditor$);
    const classes = useStyles();
    const books = useObs<Dictionary<RenderingBook>>(m.bookDict$)

    return <Fragment>
        <div className={'debug-display-container'}>
            <DebugDisplay text$={m.stringDisplay$} visible$={m.displayVisible$}/>
            <DebugDisplay text$={m.stringDisplay$} visible$={m.messagesVisible$}>
                <MessageList messageBuffer$={m.messageBuffer$}/>
            </DebugDisplay>
        </div>
        <Grid container spacing={0}>
            <Grid container item xs={12}>
                <TopBar m={m}/>
            </Grid>
            <Grid container item xs={4}>
                <LeftBar m={m}/>
            </Grid>
            <Grid container item xs={8}>
                <div className={classes.root}>
                    {Object.values(books || {}).map(b => <BookContainer key={b.name} rb={b}/>)}
                </div>
            </Grid>
        </Grid>
    </Fragment>;
}