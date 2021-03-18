import {Snackbar} from "@material-ui/core";
import {Alert} from "@material-ui/lab";
import React, {useContext} from "react";
import {ManagerContext} from "../App";
import {useObservableState} from "observable-hooks";

export const AlertSnackbar = () => {
    const m = useContext(ManagerContext);
    const alertMessages = useObservableState(m.alertToastMessageService.toastMessageList$);
    return <Snackbar
        open={!!alertMessages?.length}
        autoHideDuration={6000}
        onClose={e => m.alertToastMessageService.alertMessagesVisible$.next(false)}>
        <div>
            {
                (alertMessages || []).map(({content: {msg, severity}}, index) =>
                    <Alert key={index} severity={severity}>
                        {msg}
                    </Alert>
                )
            }
        </div>
    </Snackbar>
}

export const GeneralMessageSnackbar = () => {
    const m = useContext(ManagerContext);
    const alertMessages = useObservableState(m.generalToastMessagesService.toastMessageService.toastMessageList$);
    return <Snackbar
        open={!!alertMessages?.length}
        autoHideDuration={6000}
        anchorOrigin={{horizontal: 'center', vertical: 'top'}}
        onClose={e => m.generalToastMessagesService.toastMessageService.alertMessagesVisible$.next(false)}>
        <div>
            {
                (alertMessages || []).map(({content: {Component}}, index) =>
                    <Alert key={index} severity={'info'}>
                        <Component/>
                    </Alert>
                )
            }
        </div>
    </Snackbar>
}
