using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class CommonAvatar : PlayerModule
	{
		override public string @Description => "General avatar setup for a character. Hides head for FPS view mode. Tints the character based on network ID.";
		public GameObject @avatarObject;
		public float @characterZOffset = 0.3f;
		public GameObject @headBone;
		public Renderer[] @mainRenderer;
		public void awake(){}
		public void setPerson(ViewMode @person){}
		public void initialize(Player @character){}
		public void onBeforeRender(){}
	}
}