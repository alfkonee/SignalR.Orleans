import "isomorphic-fetch";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { RouterModule } from "@angular/router";

import { AppComponent } from "./components/app/app.component";
import { NavMenuComponent } from "./components/navmenu/navmenu.component";
import { HomeComponent } from "./components/home/home.component";
import { HeroListComponent } from "./components/hero/list.component";
import { FetchDataComponent } from "./components/fetchdata/fetchdata.component";
import { CounterComponent } from "./components/counter/counter.component";
import { HeroListRawSampleComponent } from "./components/sample/list-raw-sample.component";
import { SignalRClient } from "./components/sample/signalr.client";
import { HubConnectionFactory } from "./components/hero/hub-connection.factory";
import { NgxHubConnectionFactory } from "./components/hero/ngx.hub-connection.factory";

@NgModule({
	declarations: [
		HomeComponent,
		AppComponent,
		NavMenuComponent,
		CounterComponent,
		FetchDataComponent,
		HeroListComponent,
		HeroListRawSampleComponent
	],
	imports: [
		CommonModule,
		HttpModule,
		FormsModule,
		RouterModule.forRoot([
			{ path: "", redirectTo: "home", pathMatch: "full" },
			{ path: "home", component: HomeComponent },
			{ path: "counter", component: CounterComponent },
			{ path: "hero-list", component: HeroListComponent },
			{ path: "raw-sample", component: HeroListRawSampleComponent },
			{ path: "fetch-data", component: FetchDataComponent },
			{ path: "**", redirectTo: "home" }
		])
	],
	providers: [
		SignalRClient,
		HubConnectionFactory,
		NgxHubConnectionFactory
	]
})
export class AppModuleShared {

	constructor(
		hubFactory: NgxHubConnectionFactory
	// tslint:disable-next-line:no-empty
	) {
	}

}
