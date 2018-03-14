using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Orleans;
using Orleans.Runtime;
using Orleans.Streams;
using Sample.Orleans.Grains;
using Sample.Orleans.Grains.Heroes;
using SignalR.Orleans;
using System;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using System.Threading.Tasks;

namespace Sample.Orleans.Client.WebApp.SignalRHubs
{
	public class HeroHub : Hub<IHeroHub>
	{
		private readonly string _source = $"{nameof(HeroHub)} ::";

		private readonly IClusterClient _clusterClient;
		private readonly ILogger<HeroHub> _logger;
		
		private const string HeroStreamProviderKey = "hero-StreamProvider";

		public HeroHub(
			IClusterClient clusterClient,
			ILogger<HeroHub> logger
		)
		{
			_clusterClient = clusterClient;
			_logger = logger;
		}

		public override async Task OnConnectedAsync()
		{
			_logger.LogInformation("{hubName} User connected {connectionId}", _source, Context.ConnectionId);
			var clients = Clients.All;
			await clients.Send($"{_source} {Context.ConnectionId} joined");

			var client = Clients.Client(Context.ConnectionId);
			await client.Send($"{_source} {Context.ConnectionId} started");

			if (Context.User.Identity.IsAuthenticated)
			{
				var loggedInUser = Clients.User(Context.User.Identity.Name);
				await loggedInUser.Send($"{_source} hohoho user => {Context.User.Identity.Name} -> ConnectionId: {Context.ConnectionId}");
			}

			var streamProvider = _clusterClient.GetStreamProvider(Constants.STREAM_PROVIDER);
			Context.Connection.Metadata.Add(HeroStreamProviderKey, streamProvider);
		}

		public override async Task OnDisconnectedAsync(Exception ex)
		{
			_logger.Info("{hubName} User disconnected {connectionId}", _source, Context.ConnectionId);

			foreach (var item in Context.Connection.Metadata)
			{
				if (!(item.Value is Subscription<Hero> subscription))
					continue;

				await subscription.Stream.UnsubscribeAsync();
				subscription.Subject.Dispose();
			}
			Context.Connection.Metadata.Clear();
			await Clients.All.Send($"{_source} {Context.ConnectionId} left");
		}

		public IObservable<Hero> GetUpdates(string id)
		{
			//HACK: to trigger reminder grain
			var grain = _clusterClient.GetGrain<IHeroGrain>(id);
			grain.Get();

			Context.Connection.Metadata.TryGetValue(HeroStreamProviderKey, out object streamProviderObj);
			var streamProvider = (IStreamProvider)streamProviderObj;
			var stream = streamProvider.GetStream<Hero>(StreamConstants.HeroStream, $"hero:{id}");
			var heroSubject = new Subject<Hero>();

			Task.Run(async () =>
			 {
				 var heroStream = await stream.SubscribeAsync(
					 (action, st) =>
					 {
						 _logger.Info("{hubName} Stream [hero.health] triggered {action}", _source, action);
						 heroSubject.OnNext(action);
						 return Task.CompletedTask;
					 });
				 Context.Connection.Metadata.Add($"{nameof(GetUpdates)}:{id}", new Subscription<Hero>
				 {
					 Stream = heroStream,
					 Subject = heroSubject
				 });
			 });

			return heroSubject.AsObservable();
		}

		public async Task StreamUnsubscribe(string methodName, string id)
		{
			var key = $"{methodName}:{id}";
			if (Context.Connection.Metadata.TryGetValue(key, out object subscriptionObj))
			{
				var subscription = (Subscription<Hero>)subscriptionObj;
				await subscription.Stream.UnsubscribeAsync();
				subscription.Subject.Dispose();
				Context.Connection.Metadata.Remove(key);
			}
		}

		public Task<string> Echo(string message)
		{
			return Task.FromResult($"hello {message}");
		}

		//public IObservable<int> ObservableCounter(int count, int delay)
		//{
		//	return Observable.Interval(TimeSpan.FromMilliseconds(delay))
		//		.Select((_, index) => index)
		//		.Take(count);

		//}

		//public ReadableChannel<int> ChannelCounter(int count, int delay)
		//{
		//	var channel = Channel.CreateUnbounded<int>();

		//	Task.Run(async () =>
		//	{
		//		for (var i = 0; i < count; i++)
		//		{
		//			await channel.Out.WriteAsync(i);
		//			await Task.Delay(delay);
		//		}

		//		channel.Out.TryComplete();
		//	});

		//	return channel.In;
		//}

		//public Task SendToGroup(string groupName, string message)
		//{
		//	return Clients.Group(groupName).InvokeAsync("Send", $"{Context.ConnectionId}@{groupName}: {message}");
		//}

		//public async Task JoinGroup(string groupName)
		//{
		//	await Groups.AddAsync(Context.ConnectionId, groupName);

		//	await Clients.Group(groupName).InvokeAsync("Send", $"{Context.ConnectionId} joined {groupName}");
		//}

		//public async Task LeaveGroup(string groupName)
		//{
		//	await Groups.RemoveAsync(Context.ConnectionId, groupName);

		//	await Clients.Group(groupName).InvokeAsync("Send", $"{Context.ConnectionId} left {groupName}");
		//}
	}

	public class Subscription<T>
	{
		public StreamSubscriptionHandle<T> Stream { get; set; }
		public Subject<T> Subject { get; set; }
	}

}