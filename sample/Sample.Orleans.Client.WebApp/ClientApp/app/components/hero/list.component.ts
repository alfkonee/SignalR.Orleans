import { Component, OnInit, OnDestroy } from "@angular/core";
import { ISubscription } from "rxjs/Subscription";
import { HubConnectionFactory, ConnectionStatus, HubConnection } from "@ssv/signalr-client";

import { NgxHubConnectionFactory } from "./ngx.hub-connection.factory";

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

	private onSend$$: ISubscription | undefined;
	private kha$$: ISubscription | undefined;
	private singed$$: ISubscription | undefined;
	private hubConnection$$: ISubscription;
	private connectionState$$: ISubscription;

	constructor(
		private hubFactory: HubConnectionFactory
	) { }

	ngOnInit(): void {
		this.createConnection();
		this.connect();
	}

	createConnection() {
		this.hubConnection = this.hubFactory.get<HeroHub>("hero");
		this.singed$$ = this.hubConnection.stream<Hero>("GetUpdates", "singed")
			.subscribe(x => console.log(`${this.source} stream :: singed`, x));

		this.kha$$ = this.hubConnection.stream<Hero>("GetUpdates", "kha-zix")
			.subscribe(x => console.log(`${this.source} stream :: kha`, x));

		this.onSend$$ = this.hubConnection.on<string>("Send").subscribe(val => {
			console.log(`${this.source} send :: data received >>>`, val);
		});
	}

	connect() {
		this.hubConnection$$ = this.hubConnection.connect()
			.subscribe(x => {
				console.log(`${this.source} connected!!`);
			});
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
		if (this.onSend$$) {
			this.onSend$$.unsubscribe();
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