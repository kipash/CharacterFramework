using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public partial class GalleryCharacter : Player
	{
        public bool overrideModuleSettings = true;
        public float headHeight = 1.6f;
        public float teleportationSpeed = 3;
		public void awake(){}

        void OnDrawGizmos()
        {
            Gizmos.matrix = transform.localToWorldMatrix;
            Gizmos.color = Color.blue;
            var headPos = new Vector3(0, headHeight, 0);
            Gizmos.DrawWireSphere(headPos, .2f);
            Gizmos.DrawLine(headPos, headPos + Vector3.forward * .5f);
        }
    }
}