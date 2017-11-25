import { Component, OnInit } from "@angular/core";
import { SignalRHubConnection, ConnectionState } from "./signalr.hub-connection";

@Component({
	selector: "hero-list",
	templateUrl: "./list.component.html"
})
export class HeroListComponent implements OnInit {

	heroMessages: Hero[] = [];
	currentUser = "Anonymous";
	isConnected = false;

	private hubConnection: SignalRHubConnection<HeroHub>;

	private source = "HeroListComponent ::";
	private endpointUri = "/hero";
	private endpointUriNotifications = "/userNotifications";


	ngOnInit(): void {
		this.createConnection(this.endpointUri, "cla-key");
		this.connect();
	}

	createConnection(endpointUri: string, user: string) {
		let userToken = "";
		if (user) {
			userToken = `?token=${user}`;
		}
		this.hubConnection = new SignalRHubConnection<HeroHub>(`${this.endpointUri}${userToken}`);
	}

	connect() {

		this.hubConnection.connect()
			.subscribe();

		this.hubConnection.connectionState$
			.subscribe(state => {
				if (state === ConnectionState.connected) {
					this.hubConnection.subscribeOn<string>("Send").subscribe(heroHealth => {
						console.log(`${this.source} send :: data received`, heroHealth);
					});

					this.hubConnection.subscribeStream<Hero>("GetUpdates", "kha-zix")
						.subscribe(x => console.log(`${this.source} stream :: kha`, x));

					this.hubConnection.subscribeStream<Hero>("GetUpdates", "singed")
						.subscribe(x => console.log(`${this.source} stream :: singed`, x));
				}
			});
	}
}

export interface Hero {
	id: string;
	name: string;
	health: number;
}

export interface HeroHub {

}