import {Manager} from "../../lib/Manager";
import {useObs, usePipe} from "../../lib/UseObs";
import {Fab, Grid, Paper} from "@material-ui/core";
import CancelIcon from "@material-ui/icons/Cancel";
import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import {ExpansionPanelNoMargin} from "../ExpansionPanelNoMargin";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import EditingCardComponent from "../EditingCard/EditingCardComponent";
import Divider from "@material-ui/core/Divider";
import {AudioRecordingPopup} from "../AudioRecordingPopup";
import CardHeader from "@material-ui/core/CardHeader";
import CircularIntegration, {SpinnerState} from "../SpinningCircle";
import Avatar from "@material-ui/core/Avatar";
import {EditingCard} from "../../lib/ReactiveClasses/EditingCard";
import {Observable, of} from "rxjs";
import {filter, switchMap} from "rxjs/operators";

const useStyles = makeStyles((theme) => ({
    gridRoot: {
        height: '90vh'
    },
    column: {
        flexBasis: '33.33%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    details: {
        width: '100%',
        alignItems: 'center',
    },
    popup: {
        position: 'absolute',
        right: 0,
        zIndex: 2,
        width: '100vw',
        display: 'flex',
        maxHeight: '1px'
    },
    avatar: {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText
    },
}));

export function ReadingPage({m}: { m: Manager }) {
    const classes = useStyles();
    const editingCard = useObs(m.currentEditingCard$);
    const characters = usePipe(m.currentEditingCard$,
        (c: Observable<EditingCard | undefined>) => c.pipe(
            switchMap((editingCard) =>
                editingCard?.learningLanguage$ || of(undefined)
            )
        )
    )
    const progress = usePipe(m.currentEditingCard$,
        (c: Observable<EditingCard | undefined>) => c.pipe(
            switchMap((editingCard) =>
                editingCard?.saveInProgress$ || of(undefined)
            )
        )
    )
    const deck = usePipe(m.currentEditingCard$,
        (c: Observable<EditingCard | undefined>) => c.pipe(
            switchMap((editingCard) =>
                editingCard?.deck$ || of(undefined)
            )
        )
    )
    return <Grid container className={classes.gridRoot} /*style={{display: 'grid', gridTemplateColumns: '50% 50%'}}*/>
        <div className={classes.popup}>
            {editingCard && <Fab><CancelIcon/></Fab>}
            <span>
                {editingCard && <ExpansionPanelNoMargin defaultExpanded>
                    <ExpansionPanelSummary
                        expandIcon={<ExpandMoreIcon/>}
                        aria-controls="panel1c-content"
                        id="panel1c-header"
                    >
                        <CardHeader avatar={<CircularIntegration
                            state={progress ? SpinnerState.InProgress : SpinnerState.Success}
                            icon={<Avatar aria-label="card-type" className={classes.avatar}>{characters}</Avatar>}
                        />}
                                    title={characters}
                                    subheader={deck}
                        />
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails className={classes.details}>
                        {editingCard ? (<EditingCardComponent card={editingCard}/>) : (<div>No card found</div>)}
                    </ExpansionPanelDetails>
                    <Divider/>
                </ExpansionPanelNoMargin>
                }
            </span>
            <span>
                {editingCard && <AudioRecordingPopup r={m.audioManager.audioRecorder} m={m}/>}
            </span>
        </div>
    </Grid>
}