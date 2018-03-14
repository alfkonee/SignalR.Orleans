using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Orleans;
using Orleans.Runtime;
using Sample.Orleans.Grains.UserNotifications;
using System;
using System.Threading.Tasks;

namespace Sample.Orleans.Client.WebApp.SignalRHubs
{
	public class UserNotificationHub : Hub<IUserNotificationHub>
	{
		private readonly string _hubName = $"{nameof(UserNotificationHub)} ::";

		private readonly IClusterClient _clusterClient;
		private readonly ILogger<HeroHub> _logger;

		public UserNotificationHub(
			IClusterClient clusterClient,
			ILogger<HeroHub> logger
		)
		{
			_clusterClient = clusterClient;
			_logger = logger;
		}

		public override async Task OnConnectedAsync()
		{
			_logger.LogInformation("{HubName} user connected {connectionId}", _hubName, Context.ConnectionId);
			var clients = Clients.All;
			await clients.Broadcast(new UserNotification { MessageCount = 2 });
		}

		public override Task OnDisconnectedAsync(Exception ex)
		{
			_logger.Info("{HubName} User disconnected {connectionId}", _hubName, Context.ConnectionId);
			return Task.CompletedTask;
			//await Clients.All.BroadcastV($"{Context.ConnectionId} left");
		}
	}
}
