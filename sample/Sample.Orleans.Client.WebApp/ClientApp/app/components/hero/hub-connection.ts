import { HubConnection as SignalRHubConnection } from "@aspnet/signalr-client";
import { fromPromise } from "rxjs/observable/fromPromise";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { empty } from "rxjs/observable/empty";
import { Subject } from "rxjs/Subject";
import { Observer } from "rxjs/Observer";
import { tap, map, filter, throttleTime } from "rxjs/operators";

import { ConnectionState, ConnectionStatus, HubConnectionOptions } from "./hub-connection.model";
import { Dictionary } from "./core/collection";
import { buildQueryString } from "./core/utils";

const connectedState: ConnectionState = { status: ConnectionStatus.connected };
const disconnectedState: ConnectionState = { status: ConnectionStatus.disconnected };

export class HubConnection<THub> {

	get connectionState$() { return this._connectionState$.asObservable(); }

	private source: string;
	private hubConnection: SignalRHubConnection;
	private hubConnectionOptions$: BehaviorSubject<HubConnectionOptions>;
	private _connectionState$ = new BehaviorSubject<ConnectionState>(disconnectedState);

	constructor(connectionOption: HubConnectionOptions) {
		this.source = `[${connectionOption.key}] HubConnection ::`;

		this.hubConnectionOptions$ = new BehaviorSubject<HubConnectionOptions>(connectionOption);

		this.hubConnectionOptions$
			.pipe(
			// throttleTime(100),
			tap(x => console.warn("hubConnectionOptions triggered ", x.data)),
			map(connectionOpts => {
				const wasConnected = this._connectionState$.value.status === ConnectionStatus.connected;
				return [connectionOpts, wasConnected] as [HubConnectionOptions, boolean];
			}),
			tap(() => this.disconnect()),
			map(([connectionOpts, wasConnected]) => {
				const queryString = buildQueryString(connectionOpts.data);
				console.warn(`connecting to: ${connectionOpts.endpointUri}${queryString}`);
				return [connectionOpts, wasConnected, queryString] as [HubConnectionOptions, boolean, string];
			}),
			tap(([connectionOpts, wasConnected, queryString]) =>
				this.hubConnection = new SignalRHubConnection(`${connectionOpts.endpointUri}${queryString}`, connectionOpts.options)
			),
			filter(([, wasConnected]) => wasConnected),
			// map(() => this.connect())
			)
			.subscribe();
	}

	connect(): Observable<void> {
		console.warn(`${this.source} trying to connect...`);
		if (this._connectionState$.value.status === ConnectionStatus.connected) {
			console.warn(`${this.source} session already connected`);
			return empty();
		}

		return fromPromise(this.hubConnection.start())
			.pipe(
			tap(() => {
				console.info(`${this.source} connected!`);
				this._connectionState$.next(connectedState);
				this.hubConnection.onclose(err => {
					console.warn(`${this.source} session closed`);

					if (err) {
						console.error(`${this.source} session closed with errors`, err);
						this._connectionState$.next({ status: ConnectionStatus.disconnected, reason: "error", data: err });
					} else {
						this._connectionState$.next(disconnectedState);
					}
				});
			})
			); // .catchError();
	}

	setData(data: Dictionary<string>) {
		if (!data) {
			return;
		}
		const connection = this.hubConnectionOptions$.value;
		connection.data = { ...connection.data, ...data } as Dictionary<string>;
		this.hubConnectionOptions$.next(connection);
	}

	clearData() {
		const connection = this.hubConnectionOptions$.value;
		connection.data = undefined;
		this.hubConnectionOptions$.next(connection);
	}

	on<TResult>(methodName: keyof THub): Observable<TResult> {
		return Observable.create((observer: Observer<TResult>): (() => void) | void => {
			const updateEvent = (latestValue: TResult) => observer.next(latestValue);
			this.hubConnection.on(methodName, updateEvent);
			return () => this.hubConnection.off(methodName, updateEvent);
		});
	}

	stream<TResult>(methodName: keyof THub, ...args: any[]): Observable<TResult> {
		return Observable.create((observer: Observer<TResult>): (() => void) | void => {
			this.hubConnection.stream<TResult>(methodName, ...args).subscribe({
				closed: false,
				next: item => observer.next(item),
				error: err => observer.error(err),
				complete: () => observer.complete()
			});
			return () => this.send("StreamUnsubscribe", methodName, ...args);
		});
	}

	send(methodName: keyof THub | "StreamUnsubscribe", ...args: any[]): Observable<void> {
		return fromPromise(this.hubConnection.send(methodName, ...args));
	}

	invoke<TResult>(methodName: keyof THub, ...args: any[]): Observable<TResult> {
		return fromPromise<TResult>(this.hubConnection.invoke(methodName, ...args));
	}

	disconnect() {
		console.warn(`disconnecting...`);
		if (this._connectionState$.value.status === ConnectionStatus.connected) {
			console.warn(`stopping...`);
			this.hubConnection.stop();
			this._connectionState$.next(disconnectedState);
			// this.hubConnection = undefined as any;
		}
	}
}

// function conditionalTap<TResult>(
// 	value: TResult,
// 	conditionFn: (x: TResult) => boolean,
// 	next: (x: TResult) => void
// ): MonoTypeOperatorFunction<TResult> {
// 	return (source: Observable<TResult>): Observable<TResult> => {
// 		const result: boolean = conditionFn(value);
// 		return result ? tap(next) : tap();
// 	};
// }