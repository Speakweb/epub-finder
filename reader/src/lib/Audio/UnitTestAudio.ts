import {ReplaySubject, Subject} from "rxjs";
import {withLatestFrom, take} from "rxjs/operators";
import {sleep} from "../Util/Util";
import {MakeQuerablePromise} from "../Util/QueryablePromise";

export class UnitTestAudio {
    public isRecording$ = new ReplaySubject<boolean>(1);
    public beginRecordingSignal$ = new Subject<void>();
    public stopRecordingSignal$ = new Subject<void>();
    public recognizedText$ = new Subject<string>();
    constructor(public text: string) {
        this.beginRecordingSignal$.subscribe(async () => {
            this.isRecording$.next(true);
            const nextStopSignal = MakeQuerablePromise(this.stopRecordingSignal$.pipe(take(1)).toPromise());
            if (!nextStopSignal.isFulfilled()) {
                // We've been given a stop signal, dont output anything
                this.recognizedText$.next(text)
            }
            this.isRecording$.next(false);
        });
    }
}