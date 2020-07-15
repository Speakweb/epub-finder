import {Manager} from "../../lib/Manager";
import {useObs} from "../../lib/UseObs";
import {Grid, Slide} from "@material-ui/core";
import React, {Fragment} from "react";
import {makeStyles} from "@material-ui/core/styles";
import EditingCardComponent from "../EditingCard/EditingCardComponent";
import AudioPopup from "../AudioPopup/AudioPopup";

const useStyles = makeStyles((theme) => ({
    popup: {
        position: 'absolute',
        right: 0,
        zIndex: 2,
        width: '100vw',
        display: 'flex',
        maxHeight: '1px',
        overflow: 'visible',
        '& > *': {
            height: 'fit-content',
            flexGrow: 0
        }
    },

}));

export function ReadingPage({m}: { m: Manager }) {
    const classes = useStyles();
    const editingCard = useObs(m.currentEditingCard$);
    return <div className={classes.popup}>
        <Slide direction="down" in={!!editingCard}>
            <div style={{width: '100%', display: 'flex'}}>
                {
                    editingCard && <Fragment>
                        <EditingCardComponent card={editingCard}/>
                        <AudioPopup m={m}/>
                    </Fragment>
                }
            </div>
        </Slide>
    </div>
}