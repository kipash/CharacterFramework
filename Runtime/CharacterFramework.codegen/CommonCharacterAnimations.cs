using System;
using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public class CommonCharacterAnimations : PlayerModule
	{
		override public string @Description => "Character animation matching CharacterPhysics's states: Idle, Walking, Sprinting, Jumping, Falling and Landing";
		public Animator @animator;
		public string @jumpName = "jump";
		public string @fallingName = "falling";
		public string @startFallName = "startFall";
		public float @fallAnimDelay = 0.2f;
		public string @idleName = "idling";
		public string @walkName = "walking";
		public string @sprintName = "sprinting";
		public string @speedMultiplier = "speedMultiplier";
		public float @minWalkSpeed = 1f;
		public float @baseWalkSpeed = 2f;
		public float @minSprintSpeed = 6f;
		public float @baseSprintSpeed = 5.25f;
		public bool @adjustWithScale = true;
		public void moduleOnBeforeRender(){}

		private void OnValidate()
		{
			if (!animator) animator = GetComponentInChildren<Animator>();
		}
	}
}