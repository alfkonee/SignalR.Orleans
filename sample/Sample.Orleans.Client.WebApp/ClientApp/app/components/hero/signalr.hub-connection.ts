import { HubConnection } from "@aspnet/signalr-client";
import { Observable, SubscribableOrPromise } from "rxjs/Observable";
import { fromPromise } from "rxjs/Observable/fromPromise";
import { tap } from "rxjs/operators";
import { Observer } from "rxjs/Observer";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

export enum ConnectionState {
	connected = "Connected",
	disconnected = "Disconnected",
	error = "Disconnected with errors",
}

export class SignalRHubConnection<THub> {

	connectionState$ = new BehaviorSubject<ConnectionState>(ConnectionState.disconnected);

	private _hubConnection: HubConnection;
	private _source = `${SignalRHubConnection} ::`;

	constructor(endpointUri: string) {
		this._hubConnection = new HubConnection(endpointUri);
	}

	connect(): Observable<void> {
		return fromPromise(this._hubConnection.start())
			.pipe(
			tap(() => {
				console.debug(`${this._source} Hub connection started!!!`);
				this.connectionState$.next(ConnectionState.connected);

				this._hubConnection.onclose(err => {
					console.warn(err ? `${this._source} session is closed :( with issues` : `${this._source} session closed - gracefully`, err);
					this.connectionState$.next(err ? ConnectionState.error : ConnectionState.disconnected);
				});
			})
			); // .catchError();
	}

	on<T>(methodName: string): Observable<T> {
		return Observable.create((observer: Observer<T>): (() => void) | void => {

			const updateEvent = (latestValue: T) => observer.next(latestValue);
			this._hubConnection.on(methodName, updateEvent);
			return () => this._hubConnection.off(methodName, updateEvent);
		});
	}

	stream<TResult>(methodName: string, ...args: any[]): Observable<TResult> {
		return Observable.create((observer: Observer<TResult>): (() => void) | void => {
			// todo: dispose once available from signalr
			this._hubConnection.stream<TResult>(methodName, ...args).subscribe({
				closed: false,
				next: item => observer.next(item),
				error: err => observer.error(err),
				complete: () => observer.complete()
			});

			return () => this.send("StreamUnsubscribe", methodName, ...args);
		});
	}

	send(methodName: string, ...args: any[]): Observable<void> {
		return fromPromise(this._hubConnection.send(methodName, ...args));
	}

	invoke<T>(methodName: string, ...args: any[]): Observable<T> {
		return fromPromise<T>(this._hubConnection.invoke(methodName, ...args));
	}

	disconnect() {
		if (this.connectionState$.value === ConnectionState.connected) {
			console.debug(`${this._source} disconnect :: stopping...`);
			this._hubConnection.stop();
		}
	}

	// private reconnectStrategy() {
	// 	console.debug("reconnecting...");
	// 	setTimeout(() => this.createConnection(), 5000);
	// }

}