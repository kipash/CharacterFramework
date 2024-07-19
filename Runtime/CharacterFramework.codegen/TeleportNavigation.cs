#pragma warning disable

using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
	public partial class TeleportNavigation : PlayerModule
	{
		override public string @Description => "Smoothly translates the player to a target position";
		public float @maxRaycastDistance = 20f;
		public float @positionSmoothing = 3f;
		public float @maxSlope = 45f;
		public void start(){}
		public void moduleUpdate(){}
		public void updatePosition(){}
		public void getSafeTargetFromPointer(Camera @camera, Vector2 @screenPositionRC){}
	}
}