

```ts

// hub connection
const heroHub = new HubConnection<THub>({
    endpoint: "/hero"
});

// connect
await heroHub.connect();

heroHub.state$
    .do(state => console.log("state changed!", state))
    .subscribe();

const health$$ = heroHub.on<number>("health")
    .do(x => console.log("health changed!", x))
    .subscribe();

health$$.unsubscribe();

const healthStream$$ = heroHub.stream<number>("health", { hero: "singed" })
    .do(x => console.log("health changed!", x))
    .subscribe();
healthStream$$.unsubscribe();

// disconnect
await heroHub.disconnect();

```


```ts
const hubFactory = new HubConnectionFactory();

const heroHub: HubConnection = hubFactory.create("hero", {
    endpoint: "/hero", 
    options: {
      autoReconnectOnDataChange: true,
      data: {
        brand: "sketch7"
      }
    }
});
hubManger.setDefault(heroHub);

const heroHub: HubConnection = hubFactory.get<HeroHub>("hero"); // or .get() to get default

hubFactory.disconnectAll();
hubFactory.connectionStateChange$
  .do(({hub, state }) => console.log($`hub ${hub} state changed!`))

```

```ts

@Injectable()
class HeroService {

  private hub: HeroHub;

  constructor(
    private hubFactory: HubConnectionFactory
  )
  {
     this.hub = hubFactory.get<HeroHub>("hero");
    
     this.hub.on("health")
  }

this.hub.connect();

  private onLogin$: Observable<Action>
    .switchMap(token => this.hub.setData({token})) // auto reconnect data changes

}

```

@ssv/signalr-client

@ssv/ngx.signalr-client
@ssv/au.signalr-client

