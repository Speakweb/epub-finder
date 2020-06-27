import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import {useObs} from "../../UseObs";
import {EditingCard} from "../../lib/ReactiveClasses/EditingCard";
import ImageList from "../CardImageList";
import EditCardEnglish from "../EditCardEnglish";
import CircularIntegration, {SpinnerState} from '../SpinningCircle'
import {SoundEl} from "../SoundElement";
import {AudioRecorder, AudioTest} from "../../lib/AudioRecorder";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        '& > *': {
            width: '100%'
        }
    },
    media: {
        height: 0,
        paddingTop: '56.25%', // 16:9
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
    avatar: {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText
    },
}));


export default function EditingCardComponent({card}: { card: EditingCard }) {
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandClick = () => {
        setExpanded(!expanded);
    };
    const progress = useObs(card.saveInProgress$);
    const characters = useObs(card.learningLanguage$);
    const deck = useObs(card.deck$);
    const english = useObs(card.knownLanguage$);
    const sounds = useObs(card.sounds$);
    const photos = useObs(card.photos$);
    const frontPhotos = useObs(card.illustrationPhotos$);
    useEffect(() => {
        const els = document.getElementsByClassName('new-audio');
        for (let i = 0; i < els.length; i++) {
            // @ts-ignore
            els[i].play();
        }
    }, [sounds]);

    const [test, setTest] = useState<AudioTest | undefined>();
    useEffect(() => {
        if (characters) { // TODO shouldn't knownLanguage be entirely replaced with characters?

            let audioTest = new AudioTest();
            audioTest.text$.next(characters)
            setTest(audioTest)
        }
    }, [characters])


    return (
        <Card className={classes.root}>
            <CardHeader avatar={<CircularIntegration
                state={progress ? SpinnerState.InProgress : SpinnerState.Success}
                icon={<Avatar aria-label="card-type" className={classes.avatar}>{characters}</Avatar>}
            />}
                        action={

                            <IconButton aria-label="settings">
                                <MoreVertIcon/>
                            </IconButton>
                        }
                        title={characters}
                        subheader={deck}
            />

            <CardContent>
                <div className={classes.root}>
                    <Typography variant="h6" gutterBottom> English </Typography>
                    <EditCardEnglish e={card}/>
                    <Typography variant="h6" gutterBottom> Pictures </Typography>
                    <ImageList photos$={card.photos$} card={card} characters={characters || ""} m={card.m}/>
{/*
                    {test ? <AudioRecording t={test}/> : '<div>There should be a recording element here</div>'}
*/}
                    {/*
                    <Typography variant="h6" gutterBottom> Illustration Pictures </Typography>
                    <ImageList photos$={card.illustrationPhotos$} card={card} characters={characters || ""} m={card.m} />
*/}
                </div>

{/*
                {(sounds || []).map((s: string) => <SoundEl src={s} playOnMount={true}/>)}
*/}
            </CardContent>
            {/*

            <CardActions disableSpacing>
                <IconButton aria-label="add to favorites">
                    <FavoriteIcon />
                </IconButton>
                <IconButton aria-label="share">
                    <ShareIcon />
                </IconButton>
                <IconButton
                    className={clsx(classes.expand, {
                        [classes.expandOpen]: expanded,
                    })}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </IconButton>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Typography paragraph>Method:</Typography>
                    <Typography paragraph>
                        Heat 1/2 cup of the broth in a pot until simmering, add saffron and set aside for 10
                        minutes.
                    </Typography>
                    <Typography paragraph>
                        Heat oil in a (14- to 16-inch) paella pan or a large, deep skillet over medium-high
                        heat. Add chicken, shrimp and chorizo, and cook, stirring occasionally until lightly
                        browned, 6 to 8 minutes. Transfer shrimp to a large plate and set aside, leaving chicken
                        and chorizo in the pan. Add pimentón, bay leaves, garlic, tomatoes, onion, salt and
                        pepper, and cook, stirring often until thickened and fragrant, about 10 minutes. Add
                        saffron broth and remaining 4 1/2 cups chicken broth; bring to a boil.
                    </Typography>
                    <Typography paragraph>
                        Add rice and stir very gently to distribute. Top with artichokes and peppers, and cook
                        without stirring, until most of the liquid is absorbed, 15 to 18 minutes. Reduce heat to
                        medium-low, add reserved shrimp and mussels, tucking them down into the rice, and cook
                        again without stirring, until mussels have opened and rice is just tender, 5 to 7
                        minutes more. (Discard any mussels that don’t open.)
                    </Typography>
                    <Typography>
                        Set aside off of the heat to let rest for 10 minutes, and then serve.
                    </Typography>
                </CardContent>
            </Collapse>

*/}
        </Card>
    );
}