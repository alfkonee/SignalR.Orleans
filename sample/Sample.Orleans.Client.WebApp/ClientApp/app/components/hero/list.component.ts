import { Component, OnInit, OnDestroy } from "@angular/core";
import { ISubscription } from "rxjs/Subscription";

import { NgxHubConnectionFactory } from "./ngx.hub-connection.factory";
import { HubConnection } from "./hub-connection";
import { HubConnectionFactory } from "./hub-connection.factory";
import { ConnectionStatus } from "./hub-connection.model";

@Component({
	selector: "hero-list",
	templateUrl: "./list.component.html"
})
export class HeroListComponent implements OnInit, OnDestroy {

	heroMessages: Hero[] = [];
	currentUser = "Anonymous";
	isConnected = false;

	private hubConnection: HubConnection<HeroHub>;

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
	}

	connect() {
		this.hubConnection.connect()
			.subscribe();

		this.hubConnection.connectionState$
			.subscribe(state => {
				if (state.status === ConnectionStatus.connected) {
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

	trackByHero(_index: number, hero: Hero): string {
		return `${hero.id}-${hero.health}`;
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