using System;
using System.Collections.Generic;
using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public class StateAnimation : PlayerModule
	{
		[Serializable]
		public class StateAnimation_SpeedMultiplier
		{
			public string @stateName;
			public float @speedReference = 1;
		}

        override public string @Description => "Plays animation based on Player's state.";
		public Animator @animator;
		public float @trasnitionDuration = 0.15f;
		public StateAnimation_SpeedMultiplier[] @speedReferences;

        private void OnValidate()
		{
			if (!animator) animator = GetComponentInChildren<Animator>();
		}
	}
}