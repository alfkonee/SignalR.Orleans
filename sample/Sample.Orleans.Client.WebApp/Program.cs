using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;

namespace Sample.Orleans.Client.WebApp
{
	public class Program
	{
		public static void Main(string[] args)
		{
			BuildWebHost(args).Run();
		}

		public static IWebHost BuildWebHost(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				.UseStartup<Startup>()
				.UseUrls("http://*:1100")
				.Build();
	}
}
