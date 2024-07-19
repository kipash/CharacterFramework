#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class MobileCharacterInput : PlayerModule
	{
		override public string @Description => "Joystick, Touch, Pinch";
		public bool @mobileOnly = true;
		public float @sprintJoystickThreshold = 0.7f;
		public float @pinchSensitvity = 1.5f;
		public void initialize(Player @character){}
		public void moduleEarlyUpdate(){}
	}
}