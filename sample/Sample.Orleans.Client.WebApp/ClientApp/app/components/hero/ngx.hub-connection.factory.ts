import { Injectable, PLATFORM_ID, Inject } from "@angular/core";
import { isPlatformServer } from "@angular/common";

import { HubConnectionFactory } from "@ssv/signalr-client";

@Injectable()
export class NgxHubConnectionFactory {

	constructor(
		factory: HubConnectionFactory,
		@Inject(PLATFORM_ID) platformId: Object
	) {
		console.log("NgxHubConnectionFactory ctor");
		if (!isPlatformServer(platformId)) {
			factory.create(
				{ key: "hero", endpointUri: "http://10.0.0.14:1200/hero" },
				{ key: "user", endpointUri: "/userNotifications" },
			);
		}
	}
}