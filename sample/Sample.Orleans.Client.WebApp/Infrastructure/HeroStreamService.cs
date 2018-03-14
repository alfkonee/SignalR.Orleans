using AsyncBridge;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Orleans;
using Orleans.Runtime;
using Orleans.Streams;
using Sample.Orleans.Client.WebApp.SignalRHubs;
using Sample.Orleans.Grains.Heroes;
using SignalR.Orleans;
using System;
using System.Threading.Tasks;
using Sample.Orleans.Grains;

namespace Sample.Orleans.Client.WebApp.Infrastructure
{
	public class HeroStreamService : IDisposable
	{
		private readonly IClusterClient _clusterClient;
		private readonly ILogger<HeroStreamService> _logger;
		private readonly IHubContext<HeroHub, IHeroHub> _hubContext;
		private StreamSubscriptionHandle<Hero> _healthStreamSub;

		public HeroStreamService(
			IClusterClient clusterClient,
			ILogger<HeroStreamService> logger,
			IHubContext<HeroHub, IHeroHub> hubContext
			)
		{
			_clusterClient = clusterClient;
			_logger = logger;
			_hubContext = hubContext;

			//AsyncHelper.FireAndForget(Activate, exception =>
			//{
			//	_logger.Error(500, "HeroStreamService :: Error while register hero stream", exception);
			//});
		}

		private async Task Activate()
		{
			var heroName = "singed";

			var streamProvider = _clusterClient.GetStreamProvider(Constants.STREAM_PROVIDER);
			var stream = streamProvider.GetStream<Hero>(StreamConstants.HeroStream, $"hero:{heroName}");

			_healthStreamSub = await stream.SubscribeAsync(
				(hero, st) =>
				{
					_logger.Info("HeroStreamService :: Stream [hero.health] triggered {action} for all", hero);
					_hubContext.Clients.All.Send($"[all] {hero.Name} - {hero.Health}");
					return Task.CompletedTask;
				});
		}

		public void Dispose()
		{
			if (_healthStreamSub != null)
			{
				AsyncHelper.FireAndForget(async () => await _healthStreamSub.UnsubscribeAsync(), exception =>
				 {
					 _logger.Error(501, "HeroStreamService :: Error while unsubscribing hero stream", exception);
				 });
			}
		}
	}
}