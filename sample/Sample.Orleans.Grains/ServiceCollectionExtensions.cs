using Microsoft.Extensions.DependencyInjection;
using Sample.Orleans.Grains.Heroes;

namespace Sample.Orleans.Grains
{
	public static class ServiceCollectionExtensions
	{
		public static void AddHeroesClients(this IServiceCollection services)
		{
			services.AddSingleton<IHeroService, HeroService>();
			//services.AddSingleton<IExternalSerializer, HubMessageSerializer>();
			services.AddSingleton<IWarmUpClient, WarmUpClient>();
		}
	}
}
