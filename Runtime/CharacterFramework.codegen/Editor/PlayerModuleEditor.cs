#if UNITY_EDITOR
using System;
//using Needle.Engine.Utils;
using UnityEditor;
using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
    [CustomEditor(typeof(PlayerModule), true)]
    public class PlayerModuleEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            var module = (PlayerModule) target;
            if(module != null && module.Description != null)
            {
                //using (ColorScope.LowContrast())
                //{
                    GUILayout.BeginVertical();
                    //EditorGUILayout.LabelField("Description and notes", EditorStyles.wordWrappedLabel);
                    EditorGUILayout.LabelField(module.Description, EditorStyles.wordWrappedLabel);
                    GUILayout.EndVertical();
                //}
                DrawLine();
            }

            base.OnInspectorGUI();
        }

        protected void DrawLine(int height = 1, int spacing = 5, Color? color = null)
        {
            GUILayout.Space(spacing);
            Rect rect = EditorGUILayout.GetControlRect(false, height);
            rect.height = height;
            EditorGUI.DrawRect(rect, color ?? new Color(0.5f, 0.5f, 0.5f, .4f));
            GUILayout.Space(spacing);
        }
    }
}
#endif
