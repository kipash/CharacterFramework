using Needle.Typescript.GeneratedComponents;
using System;
using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
#if UNITY_EDITOR

    [UnityEditor.CustomEditor(typeof(GalleryCharacter), true)]
    public class GalleryCharacterEditor : PlayerEditor
    {
        protected override (Type type, string description)[] mandatoryModules { get; set; } = {
            (typeof(StandardCamera), "First and third person camera."),
            (typeof(TeleportNavigation), "Click to move navigation."),
            (typeof(SimplePointerInput), "Single pointer input."),
        };

        protected override (Type type, string description)[] optionalModules { get; set; } = { 
            (typeof(PointerVisualizer), "Visualize where the user is aiming at."),
            (typeof(CommonAvatar), "Base for an Avatar that needs to react to first or third person adjustments."),
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
    }
#endif
}
