using Microsoft.AspNetCore.Mvc;
using Orleans;
using Sample.Orleans.Grains.Heroes;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace Sample.Orleans.Client.WebApp.Controllers
{
	public class HomeController : Controller
	{
		//private readonly IHubContext<HeroHub, IHeroHub> _hubContext;

		//public HomeController(IHubContext<HeroHub, IHeroHub> hubContext)
		//{
		//	_hubContext = hubContext;
		//}

		public IActionResult Index()
		{
			//await _hubContext.Clients.All.Send("hoho");

			return View();
		}
		public IActionResult Error()
		{
			ViewData["RequestId"] = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
			return View();
		}
	}
}
