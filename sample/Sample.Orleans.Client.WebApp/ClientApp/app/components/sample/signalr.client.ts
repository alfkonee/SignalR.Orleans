import { Injectable, NgZone } from "@angular/core";
import { HubConnection } from "@aspnet/signalr-client";
import { Observable, SubscribableOrPromise } from "rxjs/Observable";
import { fromPromise } from "rxjs/Observable/fromPromise";
import { tap } from "rxjs/operators";
import { Observer } from "rxjs/Observer";

@Injectable()
export class SignalRClient {

	isConnected = false;

	private _hubConnection: HubConnection;

	constructor(
		private zone: NgZone
	) {
	}

	connect(endpointUri: string): Observable<void> {
		this._hubConnection = new HubConnection(endpointUri);
		return fromPromise(this._hubConnection.start())
			.pipe(
			tap(() => {
				console.info("SignalRClient :: Hub connection started!!!");

				this._hubConnection.onclose(err => {
					console.warn(err ? "SignalRClient :: session is closed :( with issues" : "SignalRClient :: session closed - gracefully", err);
					this.isConnected = false;

					if (err) {
						// this.reconnectStrategy();
					}
				});

				this.isConnected = true;
			})
			); // .catchError();
	}

	connectV2(endpointUri: string): Observable<void> {
		this._hubConnection = new HubConnection(endpointUri);
		return this.zone.runOutsideAngular(() => fromPromise(this._hubConnection.start())
			.pipe(
			tap(() => {
				console.info("SignalRClient :: Hub connection started!!!");

				this._hubConnection.onclose(err => {
					console.warn(err ? "SignalRClient :: session is closed :( with issues" : "SignalRClient :: session closed - gracefully", err);
					this.isConnected = false;

					if (err) {
						// this.reconnectStrategy();
					}
				});

				this.isConnected = true;
			})
			)
		);
	}

	subscribeOn<T>(methodName: string): Observable<T> {
		return Observable.create((observer: Observer<T>): (() => void) | void => {
			const updateEvent = (latestValue: T) => {
				console.log("SignalRClient :: send :: data received", latestValue);
				observer.next(latestValue);
			};

			try {
				this._hubConnection.on(methodName, updateEvent);
				return () => this._hubConnection.off(methodName, updateEvent);
			} catch (ex) {
				console.error("SignalRClient :: send :: subscribe error", ex);
				observer.error(ex);
			}
		});
	}

	subscribeStream<T>(methodName: string, ...args: any[]): Observable<T> {
		return Observable.create((observer: Observer<T>): (() => void) | void =>
			// todo: expose subscription when it will be available in signalr
			this._hubConnection.stream<T>(methodName, args).subscribe({
				closed: false,
				next: item => {
					console.log("SignalRClient :: stream :: next", item);
					observer.next(item);
				},
				error: err => {
					console.error("SignalRClient :: stream :: error", err);
					observer.error(err);
				},
				complete: () => {
					console.log("SignalRClient :: stream :: complete");
				}
			}));
	}

	send<T>(methodName: string, ...args: any[]): Observable<void> {
		return fromPromise<void>(this._hubConnection.send(methodName, args));
	}

	invoke<T>(methodName: string, ...args: any[]): Observable<T> {
		return fromPromise<T>(this._hubConnection.invoke(methodName, args));
	}

	disconnect() {
		this.isConnected = false;
		if (this._hubConnection) {
			console.debug("SignalRClient :: disconnect :: stopping...");
			this._hubConnection.stop();
		}
	}

	// private reconnectStrategy() {
	// 	console.debug("reconnecting...");
	// 	setTimeout(() => this.createConnection(), 5000);
	// }

}