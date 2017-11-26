import { HubConnection } from "@aspnet/signalr-client";
import { Observable, SubscribableOrPromise } from "rxjs/Observable";
import { fromPromise } from "rxjs/observable/fromPromise";
import { tap } from "rxjs/operators";
import { Observer } from "rxjs/Observer";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { IHubConnectionOptions } from "@aspnet/signalr-client/dist/src/IHubConnectionOptions";

export enum ConnectionState {
	connected = "Connected",
	disconnected = "Disconnected",
	error = "Disconnected with errors",
}

export class SignalRHubConnection<THub> {

	connectionState$ = new BehaviorSubject<ConnectionState>(ConnectionState.disconnected);

	private _source: string;
	private _hubConnection: HubConnection;

	constructor(connectionOption: HubConnectionOptions) {
		this._hubConnection = new HubConnection(connectionOption.endpointUri, connectionOption.options);
		this._source = `[${connectionOption.name}]${hubConnectionName} ::`;
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

	on<TResult>(methodName: keyof THub): Observable<TResult> {
		return Observable.create((observer: Observer<TResult>): (() => void) | void => {

			const updateEvent = (latestValue: TResult) => observer.next(latestValue);
			this._hubConnection.on(methodName, updateEvent);
			return () => this._hubConnection.off(methodName, updateEvent);
		});
	}

	stream<TResult>(methodName: keyof THub, ...args: any[]): Observable<TResult> {
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

	send(methodName: keyof THub | "StreamUnsubscribe", ...args: any[]): Observable<void> {
		return fromPromise(this._hubConnection.send(methodName, ...args));
	}

	invoke<T>(methodName: keyof THub, ...args: any[]): Observable<T> {
		return fromPromise<T>(this._hubConnection.invoke(methodName, ...args));
	}

	disconnect() {
		if (this.connectionState$.value === ConnectionState.connected) {
			console.debug(`${this._source} disconnect :: stopping...`);
			this._hubConnection.stop();
		}
	}
}

const hubConnectionName = SignalRHubConnection.name;

export interface HubConnectionOptions {
	name: string;
	endpointUri: string;
	options?: ConnectionOptions;
	data?: Dictionary<string>;
}

export interface ConnectionOptions extends IHubConnectionOptions {

}

export interface Dictionary<T> {
	[key: string]: T;
}