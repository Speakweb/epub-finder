import {combineLatest, Observable, ReplaySubject} from "rxjs";
import {AtomizedDocument} from "../Atomized/atomized-document";
import {shareReplay, switchMap, tap} from "rxjs/operators";
import {filterMap, findMap, firstMap} from "../map.module";
import {SettingsService} from "../../services/settings.service";
import {OpenDocumentsService, READING_DOCUMENT_NODE_LABEL, TrieObservable} from "./open-documents.service";
import {OpenDocument} from "../DocumentFrame/open-document.entity";

export class ReadingDocumentService {
    public readingDocument: OpenDocument;
    private displayDocument$ = new ReplaySubject<Observable<AtomizedDocument>>(1)

    constructor(
        {
            trie$,
            openDocumentsService,
            settingsService
        }:
            {
                trie$: TrieObservable,
                openDocumentsService: OpenDocumentsService,
                settingsService: SettingsService
            }
    ) {
        this.readingDocument = new OpenDocument(
            "Reading Document",
            trie$,
            this.displayDocument$.pipe(
                switchMap(atomizedDocument => {
                    return atomizedDocument;
                }),
                shareReplay(1)
            ),
            "Reading Document"
        );

        openDocumentsService.openDocumentTree.appendDelta$.next(
            {
                nodeLabel: 'root',
                children: {
                    [READING_DOCUMENT_NODE_LABEL]: {
                        nodeLabel: READING_DOCUMENT_NODE_LABEL,
                        children: {
                            [this.readingDocument.id]: {
                                nodeLabel: this.readingDocument.id,
                                value: this.readingDocument
                            }
                        }
                    }
                }
            }
        );

        combineLatest(
            [
                openDocumentsService.sourceDocuments$,
                settingsService.readingDocument$
            ]
        ).subscribe(([
                         checkedOutDocuments,
                         selectedDocument,
                     ]) => {
            const foundDocument = findMap(checkedOutDocuments, (id, document) => document.id === selectedDocument)
            if ((!selectedDocument || !foundDocument) && checkedOutDocuments.size) {
                const firstCheckedOutDocument = firstMap(checkedOutDocuments);
                // Will this id
                settingsService.readingDocument$.next(firstCheckedOutDocument.id);
                this.displayDocument$.next(firstCheckedOutDocument.atomizedDocument$);
            }
            if (foundDocument) {
                this.displayDocument$.next(foundDocument.atomizedDocument$);
            }
        })
    }
}