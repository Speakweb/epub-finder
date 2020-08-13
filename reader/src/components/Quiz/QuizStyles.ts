import {makeStyles} from "@material-ui/core/styles";

export const quizStyles = makeStyles((theme) => ({
    card: {
        height: '100%',
        width: '100%',
        display: "flex",
        flexFlow: "column nowrap"
    },
    center: {
        flexGrow: 1,
        textAlign: 'center'
    },
    alignLeft: {
        flexGrow: 1,
        textAlign: 'left'
    },
    cardActions: {
        display: "flex",
        justifyContent: "center"
    },
    cardContent: {
        flexGrow: 1,
        display: 'flex',
        flexFlow: 'column nowrap',
        paddingTop: '50px'
    }
}));
