import { Component, OnInit, OnDestroy } from "@angular/core";
import { ISubscription } from "rxjs/Subscription";

import { NgxHubConnectionFactory } from "./ngx.hub-connection.factory";
import { HubConnection } from "./hub-connection";
import { HubConnectionFactory } from "./hub-connection.factory";
import { ConnectionStatus } from "./hub-connection.model";
import { catchError } from "rxjs/operators";

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
	private hubConnection$$: ISubscription;
	private connectionState$$: ISubscription;

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
		this.singed$$ = this.hubConnection.stream<Hero>("GetUpdates", "singed")
			.subscribe(x => console.log(`${this.source} stream :: singed`, x));

		this.kha$$ = this.hubConnection.stream<Hero>("GetUpdates", "kha-zix")
			.subscribe(x => console.log(`${this.source} stream :: kha`, x));
	}

	connect() {
		this.hubConnection$$ = this.hubConnection.connect()
			.subscribe(x => {
				console.log(`${this.source} connected!!`);
			});

		this.hubConnection.on<string>("Send").subscribe(val => {
			console.log(`${this.source} send :: data received >>>`, val);
		});

		// this.connectionState$$ = this.hubConnection.connectionState$
		// 	.subscribe(state => {
		// 		console.log(`${this.source} state changed: ${state.status} is ${ConnectionStatus.connected} (connected)`);
		// 		if (state.status === ConnectionStatus.connected) {
		// 			this.hubConnection.on<string>("Send").subscribe(heroHealth => {
		// 				console.log(`${this.source} send :: data received`, heroHealth);
		// 			});

		// 			this.singed$$ = this.hubConnection.stream<Hero>("GetUpdates", "singed")
		// 				.subscribe(x => console.log(`${this.source} stream :: singed`, x));

		// 			this.kha$$ = this.hubConnection.stream<Hero>("GetUpdates", "kha-zix")
		// 				.subscribe(x => console.log(`${this.source} stream :: kha`, x));
		// 		}
		// 	});

	}

	dispose() {
		console.log(`${this.source} disposing...`);
		if (this.connectionState$$) {
			this.connectionState$$.unsubscribe();
		}
		if (this.hubConnection$$) {
			this.hubConnection$$.unsubscribe();
		}
		if (this.kha$$) {
			this.kha$$.unsubscribe();
		}
		if (this.singed$$) {
			this.singed$$.unsubscribe();
		}
	}

	send() {
		this.hubConnection.send("StreamUnsubscribe", "fakeMethod", "sad");
	}

	invoke() {
		this.hubConnection.invoke("Echo", "fucking builds")
			.subscribe(x => console.log(`${this.source} invoke :: result`, x));
	}

	setData() {
		this.hubConnection.setData({ token: "cla-keyxx", test: "hello1" });
		this.hubConnection.setData({ token: "gunit-x", test: "v2" });
		// this.hubConnection.setData({ token: "cla-kezy", test: "hello3" });
	}

	clearData() {
		this.hubConnection.clearData();
	}

	trackByHero(_index: number, hero: Hero): string {
		return `${hero.id}-${hero.health}`;
	}

	disconnect() {
		this.hubConnection.disconnect().subscribe();
	}

	ngOnDestroy(): void {
		this.dispose();
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