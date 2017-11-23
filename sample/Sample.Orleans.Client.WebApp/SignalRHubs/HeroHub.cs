﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Orleans;
using Orleans.Runtime;
using Orleans.Streams;
using Sample.Orleans.Grains.Heroes;
using SignalR.Orleans;
using System;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using System.Threading.Tasks;
using System.Threading.Tasks.Channels;

namespace Sample.Orleans.Client.WebApp.SignalRHubs
{
	public class HeroHub : Hub<IHeroHub>
	{
		private readonly string _source = $"{nameof(HeroHub)} ::";

		private readonly IClusterClient _clusterClient;
		private readonly ILogger<HeroHub> _logger;

		private readonly string _healthStreamSubKey = "healthStreamSub";
		private readonly string _heroSubjectStreamKey = "hero-subject";
		private readonly string _heroStreamProviderKey = "hero-StreamProvider";

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
				//await Clients.User(Context.User.Identity.Name).Send($"hohoho user => {Context.User.Identity.Name} -> ConnectionId: {Context.ConnectionId}");
			}

			var heroSubject = new Subject<string>();
			var heroName = "singed";
			var grain = _clusterClient.GetGrain<IHeroGrain>(heroName);
			var session = await grain.GetKey();

			Context.Connection.Metadata.Add("sessionId", session);

			var streamProvider = _clusterClient.GetStreamProvider(Constants.STREAM_PROVIDER);
			var stream = streamProvider.GetStream<Hero>(session, $"hero:{heroName}");
			var connectionId = Context.ConnectionId;

			var healthStreamSub = await stream.SubscribeAsync(
				(action, st) =>
				{
					_logger.Info("{hubName} Stream [hero.health] triggered {action} for connection {connection}", _source, action, connectionId);
					heroSubject.OnNext(action.ToString());
					//  Context.User.Identity.IsAuthenticated ? loggedInUser.Broadcast(action) : 
					//AsyncHelper.FireAndForget(() => client.Broadcast(action), exception =>
					//{
					//	_logger.LogError(exception, exception.Message);
					//});

					return Task.CompletedTask;
				});

			Context.Connection.Metadata.Add(_healthStreamSubKey, healthStreamSub);
			Context.Connection.Metadata.Add(_heroSubjectStreamKey, heroSubject.AsObservable());
			Context.Connection.Metadata.Add(_heroStreamProviderKey, streamProvider);
		}

		public override async Task OnDisconnectedAsync(Exception ex)
		{
			_logger.Info("{hubName} User disconnected {connectionId}", _source, Context.ConnectionId);
			if (Context.Connection.Metadata.TryGetValue(_healthStreamSubKey, out object healthStream))
			{
				_logger.Info("{hubName} Unsubscribing stream...", _source, _healthStreamSubKey, Context.ConnectionId);
				await ((StreamSubscriptionHandle<Hero>)healthStream).UnsubscribeAsync();
				Context.Connection.Metadata.Remove(_healthStreamSubKey);
			}
			if (Context.Connection.Metadata.ContainsKey(_heroSubjectStreamKey))
			{
				_logger.Info("{hubName} Unsubscribing hero subject stream...", _source, _heroSubjectStreamKey, Context.ConnectionId);
				Context.Connection.Metadata.Remove(_heroSubjectStreamKey);
			}
			await Clients.All.Send($"{_source} {Context.ConnectionId} left");
		}

		//public Task Send(Hero hero)
		//{
		//	return Clients.All.InvokeAsync("Send", hero);
		//}

		//public Task Send(string message)
		//{
		//	return Clients.All.Send(message);
		//	//return Clients.All.InvokeAsync("Send", hero);
		//}

		[Authorize]
		public IObservable<string> Health()
		{
			Context.Connection.Metadata.TryGetValue(_heroSubjectStreamKey, out object streamObj);
			return (IObservable<string>)streamObj;
		}

		public IObservable<Hero> GetUpdates(string id)
		{
			var grain = _clusterClient.GetGrain<IHeroGrain>(id);
			var session = grain.GetKey().Result;
			Context.Connection.Metadata.TryGetValue(_heroStreamProviderKey, out object streamProviderObj);
			var streamProvider = (IStreamProvider)streamProviderObj;
			var stream = streamProvider.GetStream<Hero>(session, $"hero:{id}");
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
			 });
			return heroSubject.AsObservable();
		}

		//public IObservable<string> Health2()
		//{
		//	var healthSubject = new Subject<string>();

		//Guid session;
		//if (!Context.Connection.Metadata.TryGetValue("sessionId", out object sessionIdObj))
		//{
		//	// todo abort
		//	return healthSubject;
		//}
		//session = (Guid)sessionIdObj;

		//var streamProvider = _clusterClient.GetStreamProvider(Constants.STREAM_PROVIDER);
		//var stream = streamProvider.GetStream<string>(session, "hero.health");
		//var connectionId = Context.ConnectionId;

		//var healthStreamSub = stream.SubscribeAsync(
		//	(action, st) =>
		//	{
		//		_logger.Info("Stream [hero.health] triggered {action} for connection {connection}", action, connectionId);
		//		healthSubject.OnNext(action);

		//		return Task.CompletedTask;
		//	});

		//Context.Connection.Metadata.Add(_healthStreamSubKey, healthStreamSub);

		//	return healthSubject;
		//}

		public IObservable<int> ObservableCounter(int count, int delay)
		{
			return Observable.Interval(TimeSpan.FromMilliseconds(delay))
				.Select((_, index) => index)
				.Take(count);

		}

		public ReadableChannel<int> ChannelCounter(int count, int delay)
		{
			var channel = Channel.CreateUnbounded<int>();

			Task.Run(async () =>
			{
				for (var i = 0; i < count; i++)
				{
					await channel.Out.WriteAsync(i);
					await Task.Delay(delay);
				}

				channel.Out.TryComplete();
			});

			return channel.In;
		}

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

}
