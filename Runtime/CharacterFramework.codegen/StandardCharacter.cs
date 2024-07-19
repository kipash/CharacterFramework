using UnityEditor;
using UnityEngine;
using UnityEngine.Serialization;
using UnityEngine.TextCore.Text;
using static UnityEngine.GraphicsBuffer;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
	public class StandardCharacter : Player
	{
		public float @movementSpeed = 28f;
		public float @jumpSpeed = 8f;
		public bool @enableSprint = true;
		public bool @enableLineOfSight = true;
		[FormerlySerializedAs("headHeight")] public float cameraYOffset = 1.6f;
		[FormerlySerializedAs("headSide")] public float cameraXOffset = 1f;

		public ViewMode defaultViewMode = ViewMode.ThirdPerson;
		[FormerlySerializedAs("allowedPersons")] public ViewModeFlags allowedViewModes = (ViewModeFlags)~0; 

		public void awake(){}
		public void intialize(bool @findModules){}
		public void update(){}

        private void OnDrawGizmos()
        {
            if (!gameObject.TryGetComponent<CharacterController>(out _))
            {
                var capsuleMesh = Resources.GetBuiltinResource<Mesh>("Capsule.fbx");
                var t = transform;
                var matrix = Matrix4x4.TRS(t.position, Quaternion.identity, t.lossyScale);
                Gizmos.matrix = matrix;
                Gizmos.color = new Color(.5f, .5f, .5f, .05f);
                Gizmos.DrawWireMesh(capsuleMesh, 0, Vector3.up, Quaternion.identity, new Vector3(.5f, .5f, .5f));
            }

            Gizmos.matrix = transform.localToWorldMatrix;
            Gizmos.color = Color.blue;
            
            var headPos = new Vector3(0, cameraYOffset, 0);
            Gizmos.DrawWireSphere(headPos, .2f);
            Gizmos.DrawLine(headPos, headPos + Vector3.forward * .5f);

            if ((allowedViewModes & ViewModeFlags.ThirdPerson) != 0)
            {
                var thirdPersonCameraPosition = headPos + new Vector3(cameraXOffset, 0, -1);
                Gizmos.color = new Color(1, 1, 0, .5f);
                
                Gizmos.DrawWireSphere(thirdPersonCameraPosition, .2f);
                Gizmos.DrawLine(new Vector3(cameraXOffset, 0, 0) + headPos, thirdPersonCameraPosition);
            }
        }
    }
}