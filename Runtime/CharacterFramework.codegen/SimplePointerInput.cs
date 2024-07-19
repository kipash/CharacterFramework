#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class SimplePointerInput : PlayerModule
	{
		override public string @Description => "Drag, click";
		public float @dragOrLockPointerId = 0f;
		public void moduleEarlyUpdate(){}
	}
}