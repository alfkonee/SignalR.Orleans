using Orleans;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Sample.Orleans.Grains.UserNotifications
{
	public class UserNotificationState
	{
		public UserNotification UserNotification { get; set; }
	}

	public interface IUserNotificationGrain : IGrainWithStringKey
	{
		Task Set(UserNotification item);
		Task<UserNotification> Get();
	}

	[Serializable, DebuggerDisplay("{DebuggerDisplay,nq}")]
	public class UserNotification
	{
		protected string DebuggerDisplay => $"MessageCount: '{MessageCount}'";
		public int MessageCount { get; set; }

		public override string ToString() => DebuggerDisplay;
	}
}
