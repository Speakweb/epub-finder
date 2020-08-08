import React, {ReactNode, useEffect, useState} from "react";
import {usePopper} from "react-popper";
import {makeStyles} from "@material-ui/core/styles";
import {Placement} from "@popperjs/core";

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: "#78c800",
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        maxWidth: '300px',
        '&:hover': {
            cursor: 'pointer'
        }
    },

}));

export const TutorialPopper = ({referenceElement, storageKey, children, placement}: { referenceElement: HTMLDivElement | null, storageKey: string, children?: ReactNode, placement: Placement}) => {
    const [open ,setOpen] = useState<boolean>(() => !!localStorage.getItem(storageKey));
    const classes = useStyles();
    useEffect(() => {
        setOpen(!!localStorage.getItem(storageKey))
    }, [])
    useEffect(() => {
        localStorage.setItem(storageKey, open as unknown as string)
    }, [open]);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

    const x = usePopper(referenceElement, popperElement, {
        placement,
        strategy: 'fixed'
    });
    if (open) {
        return <div ref={setPopperElement} style={x.styles.popper} {...x.attributes.popper} onClick={() => setOpen(false)}>
            <div className={classes.root}>
                {children}
            </div>
        </div>
    } else {
        return <div/>;
    }

}
