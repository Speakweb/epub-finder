import React, {forwardRef, useState} from "react";
import {flatten} from "lodash";
import {supportedDocumentFileExtensions} from "../../lib/uploading-documents/uploading-documents.service";
import CameraComponent from "../camera/take-picture";
import {Library} from "../library/library.component";
import {TextInput, Button} from "flowbite-react";

export type VariantLanguageOption = { value: string, label: string };
export type ParentLanguageOption = { value: string, label: string, variants: VariantLanguageOption[] };

export type LandingPageProps = {
    languages: ParentLanguageOption[],
    language: ParentLanguageOption | undefined,
    setLanguage: (l: ParentLanguageOption) => unknown,
    variant: VariantLanguageOption | undefined,
    setVariant: (v: VariantLanguageOption) => unknown,
    dragActive: boolean,
    onDragEnter: (e: React.DragEvent) => void,
    onDrop: (p: { e: React.DragEvent, filename: string }) => void,
    ref: React.RefObject<HTMLInputElement>,
    onClick: () => void
    onFileSelected: (p: { file: File, name: string }) => void
    onTextUpload: (p: { text: string, name: string }) => void
};

export const LandingPage = forwardRef<HTMLInputElement, LandingPageProps>((
    {
        dragActive,
        language,
        languages,
        onClick,
        onDragEnter,
        onDrop,
        setLanguage,
        setVariant,
        variant,
        onFileSelected,
        onTextUpload
    }, ref) => {
    const [uploadedFileName, setUploadedFileName] = useState<string>("")
    const [uploadedFileText, setUploadedFileText] = useState<string>("");
    const validExtensionList = Array.from(supportedDocumentFileExtensions).map(ext => `.${ext}`).join(', ');
    return <div className="w-full flex flex-row grow">
        <div className="flex flex-col w-1/2 p-8">
            <CameraComponent onPictureTaken={(image) => {
                onFileSelected({name: uploadedFileName, file: image})
            }}/>
            <Library/>
        </div>
        <div className="flex flex-col w-1/2 p-5">
            <div className="flex flex-col justify-center items-center m-8">
                <select
                    className="w-[300px] h-11 mb-[30px] text-1rem text-[#71717A]"
                    defaultValue={language?.value}
                    value={language?.value}
                    onChange={v => setLanguage(languages.find(l => l.value === v.target.value) as ParentLanguageOption)}
                >
                    {languages.map(l => <option value={l.value}>{l.label}</option>)}
                </select>
                {language?.variants?.length && (
                    <select
                        className="w-[300px] h-11 text-1rem text-[#71717A]"
                        defaultValue={variant?.value}
                        value={variant?.value}
                        onChange={(e) => {
                            const allVariants = flatten(languages.map(l => l.variants));
                            setVariant(allVariants.find(v => v.value === e.target.value) as VariantLanguageOption);
                        }}
                    >
                        {
                            language.variants.map(v => <option
                                value={v.value}
                                className="text-1rem text-[#71717A]">
                                {v.label}
                            </option>)
                        }
                    </select>
                )}
            </div>
            <div
                className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center flex-1 ${
                    dragActive && "border-[#0F91D2] bg-slate-100"
                }`}
                onDragEnter={onDragEnter}
                onDragOver={onDragEnter}
                onDragLeave={onDragEnter}
                onDrop={e => onDrop(
                    {
                        e,
                        filename: uploadedFileName
                    }
                )}
            >
                <TextInput
                    value={uploadedFileText}
                    onChange={e => setUploadedFileText(e.target.value)}
                />
                <div>
                    <TextInput
                        value={uploadedFileName}
                        onChange={e => setUploadedFileName(e.target.value)}
                    />
                    <Button
                        onClick={() => {
                            onTextUpload({text: uploadedFileText, name: uploadedFileName})
                        }}
                    >
                        Upload Text
                    </Button>
                </div>
                <input ref={ref} className="hidden" type="file" id="input-file-upload" multiple={true}
                       accept={validExtensionList}/>
                <label id="label-file-upload" htmlFor="file-upload" className={dragActive ? "drag-active" : ""}>
                    <div className="flex flex-col justify-center items-center">
                        <img className="w-12 h-12 mb-8" src={require("./upload-cloud.svg").default}/>
                        <p className="mx-5 mb-3">Select a file or drag and drop here</p>
                        <p className="mx-5 mb-5 text-gray-400">{validExtensionList} file size no more than 10mb</p>
                        <button
                            className="px-3 py-2 text-sm text-[#0F91D2] rounded-lg border border-[#0f91d2]"
                            onClick={onClick}
                        >
                            SELECT FILE
                        </button>
                    </div>
                </label>
            </div>
        </div>
    </div>;
});

