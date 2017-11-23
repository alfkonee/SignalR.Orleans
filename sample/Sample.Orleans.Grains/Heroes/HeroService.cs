using System.Collections.Generic;
using System.Linq;

namespace Sample.Orleans.Grains.Heroes
{
	public interface IHeroService
	{
		Hero GetById(string id);
		List<Hero> GetAll();
	}

	public class HeroService : IHeroService
	{
		private readonly List<Hero> _mockData = new List<Hero>
		{
			new Hero { Id = "rengar", Name = "Rengar", Health = 100},
			new Hero { Id = "kha-zix", Name = "Kha 'Zix",  Health = 100 },
			new Hero {Id = "singed", Name = "Singed", Health = 100 }
		};

		public Hero GetById(string id)
		{
			return _mockData.FirstOrDefault(x => x.Id == id);
		}

		public List<Hero> GetAll()
		{
			return _mockData;
		}
	}
}