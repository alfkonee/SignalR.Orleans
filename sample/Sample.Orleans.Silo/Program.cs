using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Orleans.Hosting;
using Orleans.Runtime.Configuration;
using Sample.Orleans.Grains;
using Sample.Orleans.Grains.Heroes;
using System;
using System.Reflection;
using System.Threading.Tasks;
using Orleans.Serialization;

namespace Sample.Orleans.Silo
{
	class Program
	{
		public static int Main(string[] args)
		{
			Console.Title = "Silo";
			return RunMainAsync().Result;
		}

		private static async Task<int> RunMainAsync()
		{
			try
			{
				var host = await StartSilo();
				Console.WriteLine("Press Enter to terminate...");
				Console.ReadLine();

				await host.StopAsync();

				return 0;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex);
				return 1;
			}
		}

		private static async Task<ISiloHost> StartSilo()
		{
			var config = ClusterConfiguration.LocalhostPrimarySilo();
			config.AddMemoryStorageProvider();
			config.Globals.FallbackSerializationProvider = typeof(ILBasedSerializer).GetTypeInfo();

			var builder = new SiloHostBuilder()
				.UseConfiguration(config.AddSignalR())
				.ConfigureServices(x =>
				{
					x.AddHeroesClients();
				})
				.AddApplicationPartsFromReferences(typeof(HeroGrain).Assembly)
				.ConfigureLogging(logging => logging.AddConsole())
				.UseSignalR()
				//.ConfigureLogging(logging => logging.AddConfiguration(configuration.GetSection("Logging")).AddConsole())
				;

			var host = builder.Build();
			await host.StartAsync();
			return host;
		}
	}
}