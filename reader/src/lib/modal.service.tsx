import React from "react";
import {FileChooser} from "../components/directory/upload.component";
import {LanguageSelect} from "../components/directory/nodes/language-select.component";
import {DocumentSelect} from "./reading-document-select.component";
import {ToggleTranslate} from "../components/directory/toggle-translate";
import {TogglePinyin} from "../components/directory/toggle-pinyin";
import {ManualTestModal} from "../components/modals/manual-test-modal.component";
import {AdjustFrequencyWeight} from "../components/directory/adjust-frequency-weight.component";
import {NavModal} from "./nav-modal";

export class ModalService {
    public languageSelect: NavModal;
    public fileUpload: NavModal;
    public documentSelect: NavModal;
    public settings: NavModal;
    public testingUtils: NavModal;

    constructor() {
        this.fileUpload = new NavModal(
            'fileUpload',
            () => <FileChooser/>
        );
        this.languageSelect = new NavModal(
            'spokenLanguage',
            () => <LanguageSelect/>
        );
        this.documentSelect = new NavModal(
            'documentSelect',
            () => <DocumentSelect/>
        );

        this.settings = new NavModal(
            'settings',
            () => <div>
                <ToggleTranslate/>
                <TogglePinyin/>
                <AdjustFrequencyWeight/>
            </div>
        );

        this.testingUtils = new NavModal(
            'testingUtils ',
            ManualTestModal
        )
    }

    public modals() {
        return [
            this.fileUpload,
            this.languageSelect,
            this.documentSelect,
            this.settings,
            this.testingUtils
        ]
    }
}

