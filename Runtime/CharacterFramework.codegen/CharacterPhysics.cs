using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public enum CharacterPhysics_MovementMode {
		Move,
		Turn
	}

	public class CharacterPhysics : PlayerModule
	{
		override public string Description => "Humanoid character physics with a capsule shape implementing walking, sprinting and jumping.";
		public CharacterPhysics_MovementMode @movementMode = CharacterPhysics_MovementMode.Move;
		public CharacterController @controller;
		public float @extraGravityForce = 4f;
		public float @groundingForce = 6f;
		public float @groundDrag = 0.9f;
		public float @moveDrag = 5f;
		public float @airbordDrag = 0f;
		public float @idleDrag = 0f;
		public float @desiredAirbornSpeed = 5f;
		public float @airbornInputMultiplier = 1f;
		public float @turnSpeed = 20f;
		public float @frictionIdle = 50f;
		public float @frictionMove = 0.5f;
		public float @frictionAirborn = 0f;
		public float @dominanceGroup = 0f;
		public void onDynamicallyConstructed(){}
		public void initialize(Player @character){}
		public void onDestroy(){}
		public void moduleUpdate(){}
		public void forceSetRotation(Quaternion @rotation){}
		public void handleMove(float @x, float @y, bool @jump, float @speed, object @onJump){}
	}
}