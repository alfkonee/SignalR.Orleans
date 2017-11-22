using Microsoft.AspNetCore.SignalR;
using Orleans;
using Orleans.Hosting;
using Orleans.Runtime.Configuration;
using SignalR.Orleans;
using SignalR.Orleans.Clients;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class OrleansDependencyInjectionExtensions
    {
        public static ClusterConfiguration AddSignalR(this ClusterConfiguration config)
        {
            config.AddSimpleMessageStreamProvider(Constants.STREAM_PROVIDER);
            try
            {
                config.AddMemoryStorageProvider("PubSubStore");
            }
            catch
            {
                // PubSubStore was already added. Do nothing.
            }
            config.AddMemoryStorageProvider(Constants.STORAGE_PROVIDER);
            return config;
        }

        public static ClientConfiguration AddSignalR(this ClientConfiguration config)
        {
            config.AddSimpleMessageStreamProvider(Constants.STREAM_PROVIDER);
            return config;
        }

        public static ISiloHostBuilder UseSignalR(this ISiloHostBuilder builder)
        {
            return builder
                .AddApplicationPartsFromReferences(typeof(ClientGrain).Assembly);
        }

        public static IClientBuilder UseSignalR(this IClientBuilder builder)
        {
            return builder
                .AddApplicationPartsFromReferences(typeof(IClientGrain).Assembly);
        }

        public static ISignalRBuilder AddOrleans(this ISignalRBuilder builder, IClientBuilder clientBuilder)
        {
            var client = clientBuilder.Build();
            client.Connect().Wait();
            return builder.AddOrleans(client);
        }

        public static ISignalRBuilder AddOrleans(this ISignalRBuilder builder, IClusterClient clusterClient)
        {
            builder.Services.AddSingleton(typeof(IClusterClient), clusterClient);
            return builder.AddOrleans();
        }

        public static ISignalRBuilder AddOrleans(this ISignalRBuilder builder)
        {
            builder.Services.AddSingleton(typeof(HubLifetimeManager<>), typeof(OrleansHubLifetimeManager<>));
            return builder;
        }
    }
}
