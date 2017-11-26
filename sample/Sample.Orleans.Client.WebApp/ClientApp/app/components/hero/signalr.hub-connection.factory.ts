import { SignalRHubConnection, Dictionary, HubConnectionOptions } from "./signalr.hub-connection";

export class HubConnectionFactory {
	private connections: Dictionary<SignalRHubConnection<any>> = {};

	create<THub>(...connectionOptions: HubConnectionOptions[]): void {
		for (const connectionOption of connectionOptions) {
			this.connections[connectionOption.name] = new SignalRHubConnection<THub>(connectionOption);
		}
	}

	get<THub>(name: string): SignalRHubConnection<THub> {
		const hub = this.connections[name];
		if (hub) {
			return hub;
		}
		throw new Error(`HubConnectionFactory :: Get :: connnection not found '${name}'`);
	}

}