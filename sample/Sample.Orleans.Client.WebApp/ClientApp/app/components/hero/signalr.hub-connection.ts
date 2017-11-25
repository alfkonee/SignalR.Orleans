import { HubConnection } from "@aspnet/signalr-client";
import { Observable, SubscribableOrPromise } from "rxjs/Observable";
import { map, tap } from "rxjs/operators";
import "rxjs/add/observable/fromPromise";
import { Observer } from "rxjs/Observer";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

export enum ConnectionState {
	connected = "Connected",
	disconnected = "Disconnected",
	error = "Disconnected with errors",
}

export class SignalRHubConnection<THub> {

	isConnected = false;
	connectionState$ = new BehaviorSubject<ConnectionState>(ConnectionState.disconnected);

	private _hubConnection: HubConnection;
	private _source = `${serviceName} ::`;

	constructor(endpointUri: string) {
		this._hubConnection = new HubConnection(endpointUri);
	}

	connect(): Observable<void> {
		return Observable.fromPromise(this._hubConnection.start())
			.pipe(
			tap(() => {
				console.info(`${this._source} Hub connection started!!!`);
				this.connectionState$.next(ConnectionState.connected);
				this.isConnected = true;

				this._hubConnection.onclose(err => {
					this.isConnected = false;
					console.warn(err ? `${this._source} session is closed :( with issues` : `${this._source} session closed - gracefully`, err);
					this.connectionState$.next(err ? ConnectionState.error : ConnectionState.disconnected);
				});
			})
			); // .catchError();
	}

	subscribeOn<T>(methodName: string): Observable<T> {
		return Observable.create((observer: Observer<T>): (() => void) | void => {
			const updateEvent = (latestValue: T) => {
				console.log(`${this._source} send :: data received >>`, latestValue);
				observer.next(latestValue);
			};

			this._hubConnection.on(methodName, updateEvent);
			return () => this._hubConnection.off(methodName, updateEvent);
		});
	}

	subscribeStream<TResult>(methodName: string, ...args: any[]): Observable<TResult> {
		return Observable.create((observer: Observer<TResult>): (() => void) | void => {
			// todo: dispose once available from signalr
			this._hubConnection.stream<TResult>(methodName, ...args).subscribe({
				closed: false,
				next: item => {
					console.log("HeroHub :: stream :: next", item);
					observer.next(item);
				},
				error: err => {
					console.log("HeroHub :: stream :: error", err);
				},
				complete: () => {
					observer.complete();
				}
			});

			return () => observer.complete();
		});
	}

	send<T>(methodName: string, ...args: any[]): Observable<void> {
		return Observable.fromPromise<void>(this._hubConnection.send(methodName, args));
	}

	invoke<T>(methodName: string, ...args: any[]): Observable<T> {
		return Observable.fromPromise<T>(this._hubConnection.invoke(methodName, args));
	}

	disconnect() {
		if (this.isConnected) {
			console.debug(`${this._source} disconnect :: stopping...`);
			this.isConnected = false;
			this._hubConnection.stop();
		}
	}

	// private reconnectStrategy() {
	// 	console.debug("reconnecting...");
	// 	setTimeout(() => this.createConnection(), 5000);
	// }

}

const serviceName = SignalRHubConnection.name;