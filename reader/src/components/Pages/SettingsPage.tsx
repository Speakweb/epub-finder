import {Manager} from "../../lib/Manager";
import React, {useContext} from "react";
import {useObservableState} from "observable-hooks";
import {HotkeyContext} from "../Main";
import {HotkeyConfig} from "../Hotkeys/HotkeyConfig";

export function SettingsPage({m}: { m: Manager }) {

    const hotkeyConfig = useContext(HotkeyContext);

    return <div className="settings-page">
        <div className="hotkey-config">
            <HotkeyConfig hotkeyConfig={hotkeyConfig} m={m}/>
        </div>
    </div>
}