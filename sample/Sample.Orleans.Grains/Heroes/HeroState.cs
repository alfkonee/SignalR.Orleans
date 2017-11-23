using Orleans;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Sample.Orleans.Grains.Heroes
{
	public class HeroState
	{
		public Hero Hero { get; set; }
	}

	public interface IHeroGrain : IGrainWithStringKey
	{
		Task Set(Hero hero);
		Task<Hero> Get();
		Task<Guid> GetKey();
	}

	[Serializable, DebuggerDisplay("{DebuggerDisplay,nq}")]
	public class Hero
	{
		protected string DebuggerDisplay => $"Id: '{Id}', Name: '{Name}', Health: '{Health}'";
		public string Id { get; set; }
		public string Name { get; set; }
		public int Health { get; set; }

		public override string ToString() => DebuggerDisplay;
	}
}