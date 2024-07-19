#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class PointerVisualizer : PlayerModule
	{
        override public string @Description => "Visualizes the pointer";
        public UnityEngine.GameObject @pointer;
    }
}