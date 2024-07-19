#if UNITY_EDITOR
using System;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
    public abstract class PlayerEditor : Editor
    {
        protected abstract (Type type, string description)[] mandatoryModules { get; set; }
        protected abstract (Type type, string description)[] optionalModules { get; set; }

        protected GUIStyle addedButton;
        protected GUIStyle headerStyle;
        protected GUIStyle foldoutStyle;
        protected GUIStyle wordWrapStyle;
        private bool stylesCreated;

        const string foldoutPrefsKey = "Character_Modules_Foldout";

        protected bool foldout
        {
            get => SessionState.GetBool(foldoutPrefsKey, false);
            set => SessionState.SetBool(foldoutPrefsKey, value);
        }

        public void UpgradeModule(Type from, Type to, string newDescription = null)
        {
            void _Migrate((Type type, string description)[] modules, Type from, Type to, string newDescription = null)
            {
                for (int i = 0; i < modules.Length; i++)
                {
                    var entry = modules[i];

                    if (entry.type.Name == from.Name)
                    {
                        entry.type = to;
                        if (newDescription != null)
                        {
                            entry.description = newDescription;
                        }
                        modules[i] = entry;
                    }
                }
            }


            _Migrate(mandatoryModules, from, to, newDescription);
            _Migrate(optionalModules, from, to, newDescription);
        }

        public bool DrawAdvancedSettings()
        {
            GUILayout.Space(8);

            TryCreateStyles();

            foldout = EditorGUILayout.BeginFoldoutHeaderGroup(foldout, new GUIContent("Advanced Settings", "Advanced settings to override character modules for more control of specific settings."), style: foldoutStyle);
            if (foldout)
            {
                DrawLine();
                if (mandatoryModules.Length > 0)
                {
                    GUILayout.Label("Default modules", headerStyle);
                    GUILayout.Label("Default modules are added on start with default values. Add them to override the default settings.", wordWrapStyle);
                    ListModules(mandatoryModules, "Override");

                    GUILayout.Space(20);
                }

                if (optionalModules.Length > 0)
                {
                    GUILayout.Label("Optional modules", headerStyle);
                    GUILayout.Label("Optional modules allows extending the character based on its current state. You can also create your own modules.", wordWrapStyle);
                    ListModules(optionalModules, "Add");
                }
            }
            else GUILayout.Space(5);
            EditorGUI.EndFoldoutHeaderGroup();

            return foldout;
        }

        const string ReuseCameraDescription = "Using a camera found on the {0} gameobject.";
        const string CreateCameraDescription = "No camera provided, a new camera will be created during runtime with default settings.";
        protected void DrawCameraPresence()
        {
            var go = target as MonoBehaviour;
            if (go == null) return;

            var cam = go?.GetComponentInChildren<Camera>();

            bool cameraPresent = cam != null;

            var msg = cameraPresent ? string.Format(ReuseCameraDescription, cam.gameObject.name) : CreateCameraDescription;
            var type = cameraPresent ? MessageType.Info : MessageType.Warning;

            GUILayout.Label("Camera", headerStyle);

            EditorGUILayout.HelpBox(msg, type);
            if (!cameraPresent && GUILayout.Button("Override default Camera"))
            {
                var camObj = new GameObject("Camera");
                Undo.RegisterCreatedObjectUndo(camObj, "Create Camera object");

                var camComp = Undo.AddComponent<Camera>(camObj);

                Undo.SetTransformParent(camObj.transform, go.transform, "Parent Camera object");


                Undo.RecordObject(camComp, "Set default settings to the Camera component");
                camComp.nearClipPlane = 0.01f;
                camComp.farClipPlane = 150f;
                camComp.fieldOfView = 60f;
            }
        }

        protected void TryCreateStyles()
        {
            if (stylesCreated)
                return;

            stylesCreated = true;

            addedButton = new GUIStyle(GUI.skin.label);
            addedButton.normal.textColor = new Color(0.5f, 0.5f, 0.5f);

            headerStyle = new GUIStyle(EditorStyles.boldLabel);
            headerStyle.wordWrap = true;

            wordWrapStyle = EditorStyles.wordWrappedLabel;

            foldoutStyle = new GUIStyle(EditorStyles.foldoutHeader);
            foldoutStyle.fontStyle = FontStyle.Bold;
        }

        protected void ListModules((Type type, string description)[] types, string addPhrase)
        {
            var obj = (target as MonoBehaviour)?.gameObject;
            if (obj == null) return;

            foreach (var typeInfo in types)
            {
                var module = obj.GetComponentInChildren(typeInfo.type);

                using (new GUILayout.HorizontalScope(GUILayout.Width(60)))
                {
                    if (module != null)
                    {
                        //using (ColorScope.LowContrast())
                        //{
                            if (GUILayout.Button("Remove", GUILayout.Width(60)))
                                Undo.DestroyObjectImmediate(module);
                        //}
                    }
                    else
                    {
                        if (GUILayout.Button(addPhrase, GUILayout.Width(60)))
                            Undo.AddComponent(obj, typeInfo.type);
                    }

                    GUILayout.FlexibleSpace();

                    GUILayout.Space(5);

                    var content = new GUIContent(ObjectNames.NicifyVariableName(typeInfo.type.Name), typeInfo.description);
                    GUILayout.Label(content, GUILayout.Width(160));

                    //using (ColorScope.LowContrast())
                    //{
                        GUILayout.Label(typeInfo.description);
                    //}

                    GUILayout.FlexibleSpace();
                }
            }
        }

        protected void DrawLine(int height = 1, int spacing = 5, Color? color = null)
        {
            GUILayout.Space(spacing);
            Rect rect = EditorGUILayout.GetControlRect(false, height);
            rect.height = height;
            EditorGUI.DrawRect(rect, color ?? new Color(0.5f, 0.5f, 0.5f, .4f));
            GUILayout.Space(spacing);
        }
        protected void DrawWireSphere(Vector3 center, float radius)
        {
            Handles.DrawWireDisc(center, Vector3.up, radius);
            Handles.DrawWireDisc(center, Vector3.right, radius);
            Handles.DrawWireDisc(center, Vector3.forward, radius);
        }
    }
}
#endif
