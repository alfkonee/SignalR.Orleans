using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Orleans;
using Orleans.Runtime;
using Orleans.Runtime.Configuration;
using Orleans.Serialization;
using Sample.Orleans.Grains.Heroes;
using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace Sample.Orleans.Client.WebApp.Infrastructure
{
	public static class OrleansConfig
	{
		public static IServiceCollection ConfigureClusterClient(this IServiceCollection services, int initializeAttemptsBeforeFailing = 7)
		{
			try
			{
				using (var client = StartClientWithRetries())
				{
					client.Wait();
					services.AddSingleton(client.Result)
						.AddSignalR()
						.AddOrleans();
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Orleans client initialization failed failed due to {ex}");

				Console.ReadLine();
			}
			return services;
		}

		private static async Task<IClusterClient> StartClientWithRetries(int initializeAttemptsBeforeFailing = 7)
		{
			int attempt = 0;
			while (true)
			{
				try
				{
					var config = ClientConfiguration.LocalhostSilo();
					config.AddSimpleMessageStreamProvider("heroes");
					config.FallbackSerializationProvider = typeof(ILBasedSerializer).GetTypeInfo();

					var client = new ClientBuilder()
						.UseConfiguration(config.AddSignalR())
						.AddApplicationPartsFromReferences(typeof(IHeroGrain).Assembly)
						.ConfigureLogging(logging => logging.AddConsole())
						.UseSignalR()
						.Build();

					await client.Connect();
					Console.WriteLine("Client successfully connect to silo host");
					return client;
				}
				catch (SiloUnavailableException ex)
				{
					attempt++;
					if (attempt > initializeAttemptsBeforeFailing)
					{
						Console.WriteLine(ex.Message);
						throw;
					}
					var delay = 2 * attempt;
					Console.WriteLine(
						$"Cluster client failed to connect. Attempt {attempt} of {initializeAttemptsBeforeFailing}. Retrying in {delay}s.",
						attempt, initializeAttemptsBeforeFailing, delay);
					Thread.Sleep(TimeSpan.FromSeconds(delay));
				}
				catch (Exception ex)
				{
					Console.WriteLine(ex.Message);
					throw;
				}
			}

		}
	}
}
