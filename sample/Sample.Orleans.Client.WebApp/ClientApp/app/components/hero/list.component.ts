import { Component, OnInit, OnDestroy } from "@angular/core";
import { SignalRHubConnection, ConnectionState } from "./signalr.hub-connection";
import { ISubscription } from "rxjs/Subscription";
import { HubConnectionFactory } from "./signalr.hub-connection.factory";
import { NgxHubConnectionFactory } from "./ngx.hub-connection.factory";

@Component({
	selector: "hero-list",
	templateUrl: "./list.component.html"
})
export class HeroListComponent implements OnInit, OnDestroy {

	heroMessages: Hero[] = [];
	currentUser = "Anonymous";
	isConnected = false;

	private hubConnection: SignalRHubConnection<HeroHub>;

	private source = "HeroListComponent ::";
	private endpointUri = "/hero";
	private endpointUriNotifications = "/userNotifications";

	private kha$$: ISubscription | undefined;
	private singed$$: ISubscription | undefined;

	constructor(
		private hubFactory: HubConnectionFactory
	) { }


	ngOnInit(): void {
		this.createConnection(this.endpointUri, "cla-key");
		this.connect();
	}

	createConnection(endpointUri: string, user: string) {
		let userToken = "";
		if (user) {
			userToken = `?token=${user}`;
		}
		this.hubConnection = this.hubFactory.get<HeroHub>("hero");
		// this.hubConnection = new SignalRHubConnection<HeroHub>({ name: "hero", endpointUri: `${this.endpointUri}${userToken}` });
	}

	connect() {
		this.hubConnection.connect()
			.subscribe();

		this.hubConnection.connectionState$
			.subscribe(state => {
				if (state === ConnectionState.connected) {
					this.hubConnection.on<string>("Send").subscribe(heroHealth => {
						console.log(`${this.source} send :: data received`, heroHealth);
					});

					this.singed$$ = this.hubConnection.stream<Hero>("GetUpdates", "singed")
						.subscribe(x => console.log(`${this.source} stream :: singed`, x));

					this.kha$$ = this.hubConnection.stream<Hero>("GetUpdates", "kha-zix")
						.subscribe(x => console.log(`${this.source} stream :: kha`, x));
				}
			});
	}

	dispose() {
		console.log(`${this.source} disposing...`);
		if (this.kha$$) {
			console.log(`${this.source} disposing kha...`);
			this.kha$$.unsubscribe();
			this.kha$$ = undefined;
		}
		if (this.singed$$) {
			console.log(`${this.source} disposing singed...`);
			this.singed$$.unsubscribe();
			this.singed$$ = undefined;
		}
	}

	send() {
		this.hubConnection.send("StreamUnsubscribe", "fakeMethod", "sad");
	}

	invoke() {
		this.hubConnection.invoke("Echo", "fucking builds")
			.subscribe(x => console.log(`${this.source} invoke :: result`, x));
	}

	ngOnDestroy(): void {
		if (this.kha$$) {
			this.kha$$.unsubscribe();
		}
		if (this.singed$$) {
			this.singed$$.unsubscribe();
		}
	}

}

export interface Hero {
	id: string;
	name: string;
	health: number;
}

export interface HeroHub {
	Send: string;
	GetUpdates: string;
	Echo: number;
}