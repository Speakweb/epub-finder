import {BehaviorSubject, combineLatest, Observable} from "rxjs";
import {LtDocument} from "@shared/";
import axios from "axios";
import {DocumentViewDto} from "../../../server/src/documents/document-view.dto";
import {firstMap, mapFromId, mapMap, mergeMaps} from "./map.module";
import {FrequencyDocument} from "./frequency-documents";
import {TrieService} from "./manager/trie.service";
import {ScheduleRowsService} from "./manager/schedule-rows.service";
import {map, shareReplay, switchMap} from "rxjs/operators";
import {observableLastValue, SettingsService} from "../services/settings.service";
import {TabulatedFrequencyDocument} from "./learning-tree/tabulated-frequency-document";

export class FrequencyDocumentsRepository {
    public all$ = new BehaviorSubject<Map<string, FrequencyDocument>>(new Map());
    public allTabulated$: Observable<TabulatedFrequencyDocument[]>
    public selected$: Observable<Map<string, FrequencyDocument>>;
    public selectedTabulated$: Observable<TabulatedFrequencyDocument[]>;

    constructor(
        {
            trieService,
            scheduleRowsService,
            settingsService,
        }: {
            trieService: TrieService,
            scheduleRowsService: ScheduleRowsService,
            settingsService: SettingsService
        }) {
        axios.get(`${process.env.PUBLIC_URL}/documents/frequency-documents`)
            .then(async response => {
                    const responseDocuments = ((response?.data || []) as DocumentViewDto[]).map(d => new LtDocument(d));
                    const mappedDocuments = mapFromId<string, LtDocument>(responseDocuments, d => d.id());
                    const frequencyDocuments = mapMap(
                        mappedDocuments,
                        (id, frequencyDocument) => [id, new FrequencyDocument(
                            frequencyDocument,
                            scheduleRowsService.indexedScheduleRows$
                                .pipe(
                                    map(obj => new Map(Object.entries(obj))),
                                    shareReplay(1)
                                ),
                            trieService.trie$
                        )]
                    );
                    const selectedFrequencyDocuments = await observableLastValue(settingsService.selectedFrequencyDocuments$);
                    if (!selectedFrequencyDocuments.length && frequencyDocuments.size) {
                        settingsService.selectedFrequencyDocuments$.next([firstMap(frequencyDocuments).frequencyDocument.id()])
                    }

                    this.all$.next(mergeMaps(frequencyDocuments, this.all$.getValue()));
                }
            );
        const tabulate = (all$1: Observable<FrequencyDocument[]>) => all$1
            .pipe(
                switchMap(all =>
                    combineLatest([...all.values()]
                        .map(d => d.tabulation$
                            .pipe(
                                map(tabulation => (
                                    new TabulatedFrequencyDocument(
                                        d.frequencyDocument,
                                        tabulation
                                    )
                                ))
                            )
                        )
                    )
                )
            );
        this.selected$ = combineLatest([
            this.all$,
            settingsService.selectedFrequencyDocuments$
        ]).pipe(
            map(([all, selectedFrequencyDocumentIds]) => {
                const newMap = new Map();
                selectedFrequencyDocumentIds.forEach(selectedFrequencyDocumentId => {
                    const selectedFrequencyDocument = all.get(selectedFrequencyDocumentId)
                    if (selectedFrequencyDocument) {
                        newMap.set(selectedFrequencyDocument.frequencyDocument.id(), selectedFrequencyDocument)
                    }
                })
                return newMap;
            }),
            shareReplay(1)
        )

        this.allTabulated$ = tabulate(this.all$.pipe(map(frequencyDocumentMap => Array.from(frequencyDocumentMap.values()))));
        this.selectedTabulated$ = tabulate(this.selected$.pipe(map(frequencyDocumentMap => Array.from(frequencyDocumentMap.values()))))
    }
}
