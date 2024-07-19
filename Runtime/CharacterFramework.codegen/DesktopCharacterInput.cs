#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class DesktopCharacterInput : PlayerModule
	{
		override public string @Description => "WSAD, Space, Shift, Arrow keys";
		public bool @lockCursor = true;
		public bool @rawMouseWhileLocked = true;
		public string[] @moveLeftKeys = new string[]{ "a", "ArrowLeft" };
		public string[] @moveRightKeys = new string[]{ "d", "ArrowRight" };
		public string[] @moveForwardKeys = new string[]{ "w", "ArrowUp" };
		public string[] @moveBackwardKeys = new string[]{ "s", "ArrowDown" };
		public string[] @jumpKeys = new string[]{ "Space" };
		public string[] @sprintKeys = new string[]{ "Shift" };
		public float @dragOrLockPointerId = 0f;
		public bool @jumpAllowHold = true;
		public void initialize(Player @character){}
		public void onDestroy(){}
		public void moduleEarlyUpdate(){}
	}
}