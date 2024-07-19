using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class CommonCharacterAudio : PlayerModule
	{
		override public string @Description => "Audio matching CharacterPhysics. Jumping & Landing SFX, footstep SFX";
		public float @stepDistance = 0.5f;
		public float @landThreshold = 0.2f;
		public bool @adjustWithScale = true;
		public AudioClip[] @footStepSFX;
		public AudioClip[] @landSFX;
		public AudioClip[] @jumpSFX;
		public void start(){}
		public void moduleOnBeforeRender(){}
	}
}