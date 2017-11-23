using Microsoft.Extensions.Logging;
using Orleans;
using Orleans.Providers;
using SignalR.Orleans;
using SignalR.Orleans.Core;
using System;
using System.Threading.Tasks;

namespace Sample.Orleans.Grains.Heroes
{
	[StorageProvider(ProviderName = "MemoryStore")]
	public class HeroGrain : Grain<HeroState>, IHeroGrain
	{
		public static Guid Key = Guid.NewGuid();

		private const string Source = nameof(HeroGrain);
		private readonly ILogger<HeroGrain> _logger;
		private readonly IHeroService _service;
		private readonly Random _random = new Random();
		private HubContext<IHeroHub> _hubContext;

		public HeroGrain(
			ILogger<HeroGrain> logger,
			IHeroService service
		)
		{
			_logger = logger;
			_service = service;
		}

		public async Task Set(Hero hero)
		{
			_logger.LogInformation("updating grain state - {hero}", hero);
			State.Hero = hero;
			await WriteStateAsync();
		}

		public Task<Hero> Get() => Task.FromResult(State.Hero);

		public Task<Guid> GetKey() => Task.FromResult(Key);

		public override async Task OnActivateAsync()
		{
			_hubContext = GrainFactory.GetHub<IHeroHub>();
			_logger.LogInformation("{Source} :: OnActivateAsync PK {PK}", Source, this.GetPrimaryKeyString());
			var item = _service.GetById(this.GetPrimaryKeyString());
			await Set(item);

			var streamProvider = GetStreamProvider(Constants.STREAM_PROVIDER);
			var stream = streamProvider.GetStream<Hero>(Key, $"hero:{this.GetPrimaryKeyString()}");

			RegisterTimer(async x =>
			{
				State.Hero.Health = _random.Next(100);

				await Task.WhenAll(
					Set(State.Hero),
					stream.OnNextAsync(State.Hero)
				  );

			}, State, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(30));
		}

		public override Task OnDeactivateAsync()
		{
			_logger.LogInformation("{Source} :: OnDeactivateAsync PK {PK}", Source, this.GetPrimaryKeyString());
			return Task.CompletedTask;
		}
	}

}