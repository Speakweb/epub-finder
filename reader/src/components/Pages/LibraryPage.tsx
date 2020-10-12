import {Manager} from "../../lib/Manager";
import {useObservableState} from "observable-hooks";
import React, {Fragment} from "react";
import {Paper, Button, Input, TextField} from "@material-ui/core";
import {flattenTreeIntoDict, Named} from "../../lib/Manager/OpenBooks";
import {difference} from 'lodash';
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import {ds_Dict} from "../../lib/Util/DeltaScanner";
import {OpenBook} from "../../lib/BookFrame/OpenBook";
import {CustomDocument, Website} from "../../lib/Website/Website";
import {interpolateSimpleCustomDoc} from "../../lib/Manager/Library";

export interface NamedObjectParams<T extends Named> {
    listObjects: T[] | ds_Dict<T>;
    onSelect: (v: T) => void
}

export const NamedObjectList = <T extends Named>({listObjects, onSelect}: NamedObjectParams<T>) => {
    return <List dense={true}>
        {
            Object.values(listObjects).map(libraryBook => {
                return <ListItem
                    key={libraryBook.name}
                    button>
                    <ListItemText primary={libraryBook.name}
                                  onClick={() => onSelect(libraryBook)}/>
                </ListItem>;
            })
        }
    </List>;
}


export function LibraryPage({m}: { m: Manager }) {
    const builtInBooks = useObservableState(m.library.builtInBooks$.dict$) || {};
    const customBooks = useObservableState(m.library.customBooks$.dict$) || {};
    const simpleText = useObservableState(m.library.simpleBook$.text$) || '';
    const simpleName = useObservableState(m.library.simpleBook$.name$) || '';
    const rawText = useObservableState(m.library.rawBook$.text$) || '';
    const rawName = useObservableState(m.library.rawBook$.name$) || '';
    const checkedOutTitles = useObservableState(m.db.checkedOutBooks$) || {};

    const allBooks = {...builtInBooks, ...customBooks};

    const booksAvailableForCheckOut: ds_Dict<Website | CustomDocument> = Object.fromEntries(
        difference(Object.keys(allBooks), Object.keys(checkedOutTitles))
            .map(story => [story, allBooks[story]])
    );

    return <Paper style={{height: '90vh'}}>
        <Paper style={{display: 'flex', flexFlow: 'row nowrap', height: '100%'}}>
            <Paper style={{flexGrow: 1}}>
                <Paper>
                    Checked out
                    <NamedObjectList
                        listObjects={
                            Object.fromEntries(
                                Object.keys(checkedOutTitles)
                                    .map(title => [title, allBooks[title]])
                                    .filter(([_, o]) => o)
                            )
                        }
                        onSelect={(b: OpenBook) => {
                            let checkedOutBooks = {...m.db.checkedOutBooks$.getValue()};
                            delete checkedOutBooks[b.name];
                            m.db.checkedOutBooks$.next(checkedOutBooks)
                        }}
                    />
                </Paper>
                <Paper>
                    To check out
                    <NamedObjectList
                        listObjects={booksAvailableForCheckOut}
                        onSelect={(b) => {
                            m.db.checkedOutBooks$.next(
                                {...m.db.checkedOutBooks$.getValue(), [b.name]: true}
                            )
                        }}
                    />
                </Paper>
            </Paper>
            <Paper style={{flexGrow: 4}}>
                <Paper style={{display: 'flex', flexFlow: 'column nowrap', height: '50%'}}>
                    <div>
                        <Button onClick={() => {
                            m.library.rawBook$.saveSignal$.next()
/*
                            m.library.appendCustomDocuments([new CustomDocument(rawName, rawText)])
*/
                        } }>Save</Button>
                        <TextField
                            label="Raw story name"
                            onChange={(ev) => m.library.rawBook$.name$.next(ev.target.value)}
                            value={rawName}
                        />
                    </div>
                    <textarea
                        style={{flexGrow: 1}}
                        onChange={e => m.library.rawBook$.text$.next(e.target.value)}
                        value={rawText}
                    >
                    </textarea>
                </Paper>
                <Paper style={{display: 'flex', flexFlow: 'column nowrap', height: '50%'}}>
                    <div>
                        <Button onClick={() => {
                            m.library.simpleBook$.saveSignal$.next();
/*
                            m.library.appendCustomDocuments(
                                [new CustomDocument(simpleName, interpolateSimpleCustomDoc(simpleText))]
                            )
*/
                        } }>Save</Button>
                        <TextField
                            style={{flexGrow: 1}}
                            label="Simple story name"
                            onChange={(ev) => m.library.simpleBook$.name$.next(ev.target.value)}
                            value={simpleName}
                        />
                    </div>
                    <textarea
                        style={{flexGrow: 1}}
                        onChange={e => m.library.simpleBook$.text$.next(e.target.value)}
                        value={simpleText}>
                    </textarea>
                </Paper>
            </Paper>
        </Paper>
    </Paper>
}
