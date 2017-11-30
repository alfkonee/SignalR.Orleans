import { HubConnection as SignalRHubConnection } from "@aspnet/signalr-client";
import { fromPromise } from "rxjs/observable/fromPromise";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { empty } from "rxjs/observable/empty";
import { of } from "rxjs/observable/of";
import { Subject } from "rxjs/Subject";
import { Observer } from "rxjs/Observer";
import { tap, map, filter, throttleTime, switchMap, skipUntil } from "rxjs/operators";

import { ConnectionState, ConnectionStatus, HubConnectionOptions } from "./hub-connection.model";
import { Dictionary } from "./core/collection";
import { buildQueryString } from "./core/utils";
import { takeUntil } from "rxjs/operators/takeUntil";
import { take } from "rxjs/operators/take";
import { delay } from "rxjs/operators/delay";
import { delayWhen } from "rxjs/operators/delayWhen";

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
			map(connectionOpts => [connectionOpts, this._connectionState$.value.status] as [HubConnectionOptions, ConnectionStatus]),
			switchMap(([connectionOpts, prevConnectionStatus]) => this.disconnect().pipe(
				map(() => {
					const queryString = buildQueryString(connectionOpts.data);
					console.warn(`connecting to: ${connectionOpts.endpointUri}${queryString}`);
					return queryString;
				}),
				tap(queryString =>
					this.hubConnection = new SignalRHubConnection(`${connectionOpts.endpointUri}${queryString}`, connectionOpts.options)
				),
				filter(() => prevConnectionStatus === ConnectionStatus.connected),
				switchMap(() => this.connect())
			)
			))
			.subscribe();
	}

	connect(): Observable<void> {
		console.warn(`${this.source} trying to connect...`);
		if (this._connectionState$.value.status === ConnectionStatus.connected) {
			console.warn(`${this.source} session already connected`);
			return empty();
		}

		// todo: check if needed
		if (!this.hubConnection) {
			const connectionOpts = this.hubConnectionOptions$.value;
			const queryString = buildQueryString(connectionOpts.data);
			this.hubConnection = new SignalRHubConnection(`${connectionOpts.endpointUri}${queryString}`, connectionOpts.options);
		}

		return fromPromise(this.hubConnection.start())
			.pipe(
			tap(() => {
				console.info(`${this.source} connected!`);
				this._connectionState$.next(connectedState);
				this.hubConnection.onclose(err => {

					if (err) {
						console.error(`${this.source} session closed with errors`, err);
						this._connectionState$.next({ status: ConnectionStatus.disconnected, reason: "error", data: err });
					} else {
						console.warn(`${this.source} session closed`);
						this._connectionState$.next(disconnectedState);
					}
				});
			})
			); // todo: retry
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
		const stream$: Observable<TResult> = Observable.create((observer: Observer<TResult>): (() => void) | void => {
			this.hubConnection.stream<TResult>(methodName, ...args).subscribe({
				closed: false,
				next: item => observer.next(item),
				error: err => {
					if (err && err.message !== "Invocation cancelled due to connection being closed.") {
						observer.error(err);
					}
				},
				complete: () => observer.complete()
			});
			return () => {
				console.warn(">>> stream dispose!");
				if (this._connectionState$.value.status === ConnectionStatus.connected) {
					this.send("StreamUnsubscribe", methodName, ...args);
				}
			};
		});
		return of(null).pipe(
			tap(() => console.log(`${this.source} stream init`)),
			switchMap(() => this.connectionState$.pipe(
				tap(() => console.log(`${this.source} stream - until start...`)),
				skipUntil(this.connectionState$.pipe(filter(x => x.status === ConnectionStatus.connected))),
				tap(() => console.log(`${this.source} stream - until complete`)),
				take(1)
			)),
			tap(() => console.log(`${this.source} stream - start`)),
			switchMap(() => stream$) // todo: retry after reconnection
		);
	}

	send(methodName: keyof THub | "StreamUnsubscribe", ...args: any[]): Observable<void> {
		return fromPromise(this.hubConnection.send(methodName, ...args));
	}

	invoke<TResult>(methodName: keyof THub, ...args: any[]): Observable<TResult> {
		return fromPromise<TResult>(this.hubConnection.invoke(methodName, ...args));
	}

	disconnect() {
		console.warn(`disconnecting...`);
		return of(null).pipe(
			tap(() => console.warn(`${this.source} stopping init`)),
			filter(() => this._connectionState$.value.status === ConnectionStatus.connected),
			tap(() => console.warn(`${this.source} stopping - start...`)),
			tap(() => this.hubConnection.stop()),
			delay(1000), // workaround since signalr are returning void and internally firing a callback for disconnect
			tap(() => console.warn(`${this.source} stopping - complete`)),
			take(1)
		);
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