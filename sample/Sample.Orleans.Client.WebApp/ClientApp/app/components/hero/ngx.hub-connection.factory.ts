import { Injectable, PLATFORM_ID, Inject } from "@angular/core";
import { isPlatformServer } from "@angular/common";

import { HubConnectionFactory } from "./signalr.hub-connection.factory";

@Injectable()
export class NgxHubConnectionFactory {

	constructor(
		factory: HubConnectionFactory,
		@Inject(PLATFORM_ID) platformId: Object
	) {
		console.log("NgxHubConnectionFactory ctor");
		if (!isPlatformServer(platformId)) {
			factory.create(
				{ name: "hero", endpointUri: "/hero" },
				{ name: "user", endpointUri: "/userNotifications" },
			);
		}
	}
}