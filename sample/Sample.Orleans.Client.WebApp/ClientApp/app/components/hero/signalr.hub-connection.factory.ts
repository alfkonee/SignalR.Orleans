import { SignalRHubConnection, Dictionary, HubConnectionOptions } from "./signalr.hub-connection";

export class HubConnectionFactory {
	private connections: Dictionary<SignalRHubConnection<any>> = {};

	create(...connectionOptions: HubConnectionOptions[]): this {
		for (const connectionOption of connectionOptions) {
			this.connections[connectionOption.name] = new SignalRHubConnection<any>(connectionOption);
		}

		return this;
	}

	get<THub>(name: string): SignalRHubConnection<THub> {
		const hub = this.connections[name];
		if (hub) {
			return hub;
		}
		throw new Error(`HubConnectionFactory :: Get :: connnection not found '${name}'`);
	}

}