using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.Webpack;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sample.Orleans.Client.WebApp.Infrastructure;
using Sample.Orleans.Client.WebApp.SignalRHubs;
using Sample.Orleans.Grains;

namespace Sample.Orleans.Client.WebApp
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services.ConfigureClusterClient();
			services.AddCustomAuthentication();
			services.AddHeroesClients();
			services.AddMvc();
			services.AddSingleton<HeroStreamService>();

			services.AddCors(o =>
			{
				o.AddPolicy("Everything", p =>
				{
					p.AllowAnyHeader()
						.AllowAnyMethod()
						.AllowAnyOrigin();
				});
			});
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IHostingEnvironment env, IWarmUpClient warmUpClient, HeroStreamService heroStream)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
				app.UseWebpackDevMiddleware(new WebpackDevMiddlewareOptions
				{
					HotModuleReplacement = true
				});
			}
			else
			{
				app.UseExceptionHandler("/Home/Error");
			}

			app.UseStaticFiles();


			warmUpClient.Initialize();
			app.UseAuthentication();

			app.UseCors("Everything");

			app.UseSignalR(routes =>
			{
				routes.MapHub<HeroHub>("hero");
				routes.MapHub<UserNotificationHub>("userNotifications");

			});
			app.UseMvc(routes =>
			{
				routes.MapRoute(
					name: "default",
					template: "{controller=Home}/{action=Index}/{id?}");

				routes.MapSpaFallbackRoute(
					name: "spa-fallback",
					defaults: new { controller = "Home", action = "Index" });
			});
		}
	}
}
