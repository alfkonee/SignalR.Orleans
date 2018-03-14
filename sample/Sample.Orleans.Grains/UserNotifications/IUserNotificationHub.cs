using System.Threading.Tasks;

namespace Sample.Orleans.Grains.UserNotifications
{
	public interface IUserNotificationHub
	{
		Task Broadcast(UserNotification item);
		Task MessageCount(int count);
	}
}