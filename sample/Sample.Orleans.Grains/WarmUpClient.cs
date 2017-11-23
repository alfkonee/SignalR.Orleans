using Orleans;
using Sample.Orleans.Grains.Heroes;
using System.Threading.Tasks;
using Sample.Orleans.Grains.UserNotifications;

namespace Sample.Orleans.Grains
{
	public class WarmUpClient : IWarmUpClient
	{
		private readonly IClusterClient _clusterClient;

		public WarmUpClient(IClusterClient clusterClient)
		{
			_clusterClient = clusterClient;
		}
		public Task Initialize()
		{
			var heroCollectionGrain = _clusterClient.GetGrain<IHeroGrain>("singed");
			var userNotificationGrain = _clusterClient.GetGrain<IUserNotificationGrain>("clayton");
			userNotificationGrain.Get();
			return heroCollectionGrain.Get();
		}
	}

	public interface IWarmUpClient
	{
		Task Initialize();
	}
}