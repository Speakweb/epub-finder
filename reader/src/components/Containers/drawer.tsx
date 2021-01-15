import React, {useContext} from 'react';
import clsx from 'clsx';
import {createStyles, makeStyles, useTheme, Theme} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import {ManagerContext} from "../../App";
import {useObservableState} from "observable-hooks";
import {TreeMenu} from "../TreeMenu/tree-menu.component";
import {AllItemsContainer} from "./all-items-container.component";

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
            height: '100%'
        },
        menuButton: {
            marginRight: 36,
        },
        hide: {
            display: 'none',
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
        },
        drawerOpen: {
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        drawerClose: {
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            width: theme.spacing(7) + 1,
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9) + 1,
            },
        },
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: theme.spacing(0, 1),
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(3),
        },
    }),
);

export const MiniDrawer: React.FC<{}> = ({children}) => {
    const m = useContext(ManagerContext);
    const treeMenuService = m.treeMenuService;
    const menuItemTree = useObservableState(treeMenuService.tree.updates$);
    const directoryPath = useObservableState(m.settingsService.directoryPath$) || '';

    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    return (
        <div className={'app-container'}>
            <Drawer
                variant="permanent"
                className={clsx(classes.drawer, {
                    [classes.drawerOpen]: open,
                    [classes.drawerClose]: !open,
                })}
                classes={{
                    paper: clsx({
                        [classes.drawerOpen]: open,
                        [classes.drawerClose]: !open,
                    }),
                }}
            >
                {
                    menuItemTree?.sourced && <TreeMenu
                        title={() => <Typography
                            ref={ref => m.introService.titleRef$.next(ref)}
                            variant='h6'>
                        </Typography>
                        }
                        tree={menuItemTree.sourced}
                        directoryPath={directoryPath.split('.').filter(v => v)}
                        directoryChanged={directoryPath => m.settingsService.directoryPath$.next(directoryPath.join('.'))}
                        componentChanged={componentPath => {
                            m.settingsService.componentPath$.next(componentPath.join('.'));
                        }}
                        actionSelected={actionPath => treeMenuService.actionSelected$.next(actionPath)}
                    >
                        <ListItem button>
                            <IconButton onClick={ () => setOpen(!open)}>
                                {open ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                            </IconButton>
                        </ListItem>
                    </TreeMenu>
                }
            </Drawer>
            <AllItemsContainer/>
        </div>
    );
}