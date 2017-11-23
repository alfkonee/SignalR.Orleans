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
import { SignalRClient } from "./components/hero/signalr.client";
import { FetchDataComponent } from "./components/fetchdata/fetchdata.component";
import { CounterComponent } from "./components/counter/counter.component";

@NgModule({
	declarations: [
		AppComponent,
		NavMenuComponent,
		CounterComponent,
		FetchDataComponent,
		HeroListComponent,
		HomeComponent
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
			{ path: "fetch-data", component: FetchDataComponent },
			{ path: "**", redirectTo: "home" }
		])
	],
	providers: [
		SignalRClient
	]
})
export class AppModuleShared {
}
