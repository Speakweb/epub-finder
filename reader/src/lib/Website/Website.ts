import {from, Observable} from "rxjs";
import {XMLSerializer} from "xmldom";
import {AtomizedDocument} from "../Atomized/AtomizedDocument";

export class Website {
    constructor(
        public name: string,
        public url: string,
        public getSrc: (url: string) => Observable<string>
    ) {
    }
}

export function getSrcHttp(url: string): Observable<string> {
    return from(new Promise<string>(resolve => {
        const oReq = new XMLHttpRequest();
        oReq.addEventListener("load", response => {
            resolve(oReq.responseText);
        });
        oReq.open("GET", url);
        oReq.send();
    }))
}