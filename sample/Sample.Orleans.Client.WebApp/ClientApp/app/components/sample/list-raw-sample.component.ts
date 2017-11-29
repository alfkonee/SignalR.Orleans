import { Component, OnInit } from "@angular/core";
import { HubConnection, HttpClient, TransportType } from "@aspnet/signalr-client";
import { HttpHeaders } from "@angular/common/http";


@Component({
	selector: "hero-list-raw",
	templateUrl: "./list-raw-sample.component.html"
})
export class HeroListRawSampleComponent implements OnInit {

	heroMessages: Hero[] = [];
	currentUser = "Anonymous";
	isConnected = false;

	private _hubConnection: HubConnection;
	private _hubConnectionNotifications: HubConnection;

	// private endpointUri = "http://10.81.1.116:1200/hero";
	private endpointUri = "/hero";
	private endpointUriNotifications = "/userNotifications";

	ngOnInit(): void {
		this.createConnection("cla-key");
		// this.createConnectionNotification("cla-key");
	}

	loginAsClayton() {
		this.createConnection("cla-key", () => this.currentUser = "Clayton");
	}

	loginAsStephen() {
		this.createConnection("ste-key", () => this.currentUser = "Stephen");
	}

	connectAsAnonymous() {
		this.createConnection();
	}

	stop() {
		this.isConnected = false;
		if (this._hubConnection) {
			this._hubConnection.stop();
		}
	}

	sendMessage(): void {
		// const data = `Sent: ${this.message}`;
		// this._hubConnection.send()

		// this._hubConnection.invoke("Send", data);
		// this.messages.push(data);
	}

	authorizedSubscriptionStream() {
		this._hubConnection.stream<string>("Health").subscribe({
			closed: false,
			next: item => {
				console.log("HeroHub :: stream health: next ", item);
			},
			error: err => {
				console.log("HeroHub :: stream health: error ", err);
			},
			complete: () => {
				console.log("HeroHub :: stream health: complete ");
			}
		});
	}

	defaultSubscriptions() {
		this._hubConnection.on("Send", (heroHealth: string) => {
			console.log("HeroHub :: send :: data received", heroHealth);
		});

		this._hubConnection.on("Broadcast", (hero: Hero) => {
			console.log("HeroHub :: broadcast :: HERO", hero);
			this.heroMessages.push(hero);
		});

		console.log("HeroHub ::opening stream");
		this.openAll("rengar");
		this.openAll("kha-zix");
		// this._hubConnection.stream<Hero>("GetUpdates", "rengar").subscribe({
		// 	closed: false,
		// 	next: item => {
		// 		console.log("HeroHub :: stream :: next", item);
		// 	},
		// 	error: err => {
		// 		console.log("HeroHub :: stream :: error", err);
		// 	},
		// 	complete: () => {
		// 		console.log("HeroHub :: stream :: complete");
		// 	}
		// });

		// this._hubConnection.stream<Hero>("GetUpdates", "kha-zix").subscribe({
		// 	closed: false,
		// 	next: item => {
		// 		console.log("HeroHub :: stream :: next", item);
		// 	},
		// 	error: err => {
		// 		console.log("HeroHub :: stream :: error", err);
		// 	},
		// 	complete: () => {
		// 		console.log("HeroHub :: stream :: complete");
		// 	}
		// });
	}

	openAll(id: string) {
		return this._hubConnection.stream<Hero>("GetUpdates", id).subscribe({
			closed: false,
			next: item => {
				console.log("HeroHub :: stream :: next", item);
			},
			error: err => {
				console.log("HeroHub :: stream :: error", err);
			},
			complete: () => {
				console.log("HeroHub :: stream :: complete");
			}
		});
	}

	sampleSubscription() {
		this._hubConnection.stream<string>("ObservableCounter", 10, (Math.random() * 5) * 200).subscribe({
			closed: false,
			next: item => {
				console.log("HeroHub :: stream: next ", item);
			},
			error: err => {
				console.log("HeroHub :: stream: error ", err);
			},
			complete: () => {
				console.log("HeroHub :: stream: complete ");
			}
		});

		this._hubConnection.stream<string>("ChannelCounter", 10, (Math.random() * 5) * 200).subscribe({
			closed: false,
			next: item => {
				console.log("HeroHub :: stream: next 2 ", item);
			},
			error: err => {
				console.log("HeroHub :: stream: error 2", err);
			},
			complete: () => {
				console.log("HeroHub :: stream: complete 2");
			}
		});
	}

	trackByHero(_index: number, hero: Hero): string {
		return `${hero.id}-${hero.health}`;
	}

	private createConnection(user?: string, onConnect?: () => void, endpointUri = this.endpointUri): Promise<void> {
		let userToken = "";
		if (user) {
			userToken = `?token=${user}`;
		}

		if (this._hubConnection) {
			this._hubConnection.stop();
		}

		this._hubConnection = new HubConnection(`${endpointUri}${userToken}`);

		return this._hubConnection.start()
			.then(() => {
				console.info("HeroHub :: Hub connection started");

				if (onConnect) {
					onConnect();
				} else {
					this.currentUser = "Anonymous";
				}

				this.defaultSubscriptions();

				this._hubConnection.onclose(err => {
					console.warn("HeroHub :: connection closed!", err);
					this.currentUser = err ? "session is closed :( with issues" : "session closed - gracefully";
					this.isConnected = false;

					if (err) {
						this.reconnectStrategy();
					}
				});

				this.isConnected = true;
			})
			.catch(() => {
				console.error("HeroHub :: Error while establishing connection");
				this.isConnected = false;
				this.reconnectStrategy();
			});
	}

	private createConnectionNotification(user?: string, onConnect?: () => void, endpointUri = this.endpointUriNotifications): Promise<void> {
		let userToken = "";
		if (user) {
			userToken = `?token=${user}`;
		}

		if (this._hubConnectionNotifications) {
			this._hubConnectionNotifications.stop();
		}

		this._hubConnectionNotifications = new HubConnection(`${endpointUri}${userToken}`);

		return this._hubConnectionNotifications.start()
			.then(() => {
				console.info("NotificationHub :: Hub connection started");

				if (onConnect) {
					onConnect();
				} else {
					this.currentUser = "Anonymous";
				}

				// this._hubConnectionNotifications.on("BroadcastV", (notification: any) => {
				// 	console.warn("NotificationHub :: BroadcastV :: notification ", notification);
				// });

				this._hubConnectionNotifications.on("Broadcast", (notification: any) => {
					console.warn("NotificationHub :: broadcast :: notification", notification);
				});

				this._hubConnectionNotifications.on("MessageCount", (notification: any) => {
					console.warn("NotificationHub :: MessageCount :: notification", notification);
				});

				this._hubConnectionNotifications.onclose(err => {
					console.warn("NotificationHub :: connection closed!", err);
					this.currentUser = err ? "session is closed :( with issues" : "session closed - gracefully";
					this.isConnected = false;

					if (err) {
						this.reconnectStrategy();
					}
				});

				this.isConnected = true;
			})
			.catch(() => {
				console.error("NotificationHub :: Error while establishing connection");
				this.isConnected = false;
				this.reconnectStrategy();
			});
	}

	private reconnectStrategy() {
		console.debug("reconnecting...");
		setTimeout(() => this.createConnection(), 5000);
	}

}

export interface Hero {
	id: string;
	name: string;
	health: number;
}
