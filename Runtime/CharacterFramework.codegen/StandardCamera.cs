#pragma warning disable

using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
	public partial class StandardCamera : PlayerCamera
	{
		override public string @Description => "First and Third Person Camera";
		public UnityEngine.Vector2 @distance = new UnityEngine.Vector2(0.4f, 6f);
		public float @startDistance = 4f;
		public UnityEngine.Vector3 @offset = new UnityEngine.Vector3(0f, 1.6f, 0f);
		[UnityEngine.Tooltip("Clamp the up-down rotation of the camera")]
		public UnityEngine.Vector2 @xRotClamp = new UnityEngine.Vector2(-89, 89f);
		public float @lookSensitivity = 4f;
		public float @zoomSensitivity = 0.005f;
		public bool @enableFOVBoost = true;
		public float @sprintFOVSpeed = 5f;
		public float @sprintVelocityThreshold = 6f;
		public float @thirdPersonFovIncrease = 10f;
		public float @thirdPersonFov = 60f;
		public float @firstPersonFov = 80f;
		public float @zoomSmoothing = 10f;
		public bool @enableLineOfSight = true;
		public float @lineOfSightOffset = 0.5f;
		public bool adjustWithScale = true;
		public void initialize(Player @character){}
		public void onDynamicallyConstructed(){}
		public void moduleOnBeforeRender(){}
		public void handleZoom(float @scrollDelta){}
		public void handleLook(float @lookX, float @lookY){}
		public void handleLineOfSight(){}
		public void handleFOVBoost(){}
		public void switchPerson(ViewMode @mode){}
		public void restoreDefault(){}

        private void OnValidate()
        {
			camera ??= GetComponentInChildren<Camera>();
        }
    }
}