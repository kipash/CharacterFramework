#if UNITY_EDITOR
using System;
using UnityEditor;
using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
    [CustomEditor(typeof(StandardCharacter), true)]
    public class StandardCharacterEditor : PlayerEditor
    {
        protected override (Type type, string description)[] mandatoryModules { get; set; } = {
            (typeof(StandardCamera), "First and third person camera."),
            (typeof(DesktopCharacterInput), "Keyboard input for movement, sprinting and jumping."),
            (typeof(MobileCharacterInput), "Touch screen input for movement, sprinting and jumping."),
            (typeof(CharacterPhysics), "Physics of an character that can walk, jump and stick to platforms.")
        };

        protected override (Type type, string description)[] optionalModules { get; set; } = {
            (typeof(CommonAvatar), "Base for an Avatar that needs to react to first or third person adjustments."),
            (typeof(CommonCharacterAnimations), "Plays movement animations."),
            (typeof(CommonCharacterAudio), "Plays footstep, landing and jumping sounds.")
        };

        public override void OnInspectorGUI()
        {
            base.OnInspectorGUI();

            if (DrawAdvancedSettings())
            {
                GUILayout.Space(20);
                DrawCameraPresence();
            }
        }

        GUIStyle textStyle;
        //TODO: input fields in inspector are not selectable while handles are drawn
        /*void OnSceneGUI()
        {
            var character = target as StandardCharacter;
            if (character == null) return;

            var transform = character.transform;
            if(textStyle == null)
            {
                textStyle = new GUIStyle(GUI.skin.label);
                textStyle.fontSize = 18;
                textStyle.alignment = TextAnchor.MiddleCenter;
            }

            bool displayText = true;
            var scene = EditorWindow.GetWindow<SceneView>();
            if(scene)
            {
                var camGo = scene.camera.gameObject;
                var distance = Vector3.Distance(camGo.transform.position, character.transform.position);
                var fontSize = (int)(Mathf.InverseLerp(30, 10, distance) * 15);
                displayText = !Mathf.Approximately(fontSize, 0);
                textStyle.fontSize = fontSize;
            }

            textStyle.normal.textColor = Color.HSVToRGB(.6f, .6f, 1f);
            var headPos = new Vector3(0, character.cameraYOffset + .3f, 0);

            Handles.matrix = transform.localToWorldMatrix;

            if (displayText)
                Handles.Label(headPos, "First person", textStyle);

            if ((character.allowedViewModes & ViewModeFlags.ThirdPerson) != 0)
            {
                var thirdPersonCameraPosition = headPos + new Vector3(character.cameraXOffset, 0, -1);

                textStyle.normal.textColor = Color.HSVToRGB(.12f, 1f, 1f);
                if (displayText)
                    Handles.Label(thirdPersonCameraPosition, "Third person", textStyle);
            }
        }*/
    }
}

#endif