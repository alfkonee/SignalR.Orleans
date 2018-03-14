using Orleans;
using Sample.Orleans.Grains.Heroes;
using Sample.Orleans.Grains.UserNotifications;
using System.Threading.Tasks;

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
			var grain = _clusterClient.GetGrain<IUserNotificationGrain>("clayton");
			return grain.Get();
		}
	}

	public interface IWarmUpClient
	{
		Task Initialize();
	}
}