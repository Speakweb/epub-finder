import {GetWorkerResults} from "../Util/GetWorkerResults";
import {OpenBook} from "../BookFrame/OpenBook";
import {from, Observable} from "rxjs";
import {Website} from "../Website/Website";
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
import AtomizeUrl from 'Worker-loader?name=dist/[name].js!../Worker/AtomizeUrl';
import {TrieWrapper} from "../TrieWrapper";

export type TrieObservable = Observable<TrieWrapper>

export function NewOpenBook(
    page: Website,
    trie$: TrieObservable
): Observable<OpenBook> {
    return from(new Promise<OpenBook>(async resolve => {
        new OpenBook(page.name, trie$).url$.next(page.url);
        resolve(new OpenBook(page.name, trie$))
    }))
}