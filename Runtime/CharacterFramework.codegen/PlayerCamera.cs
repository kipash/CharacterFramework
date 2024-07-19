#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class PlayerCamera : PlayerModule
	{
		override public string @Description => "Camera that can construct itself dynamically";
		public UnityEngine.Camera @camera;
		public void initialize(Player @character){}
		public void onDestroy(){}
		public void onDynamicallyConstructed(){}
	}
}