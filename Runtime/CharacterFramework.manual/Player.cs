#pragma warning disable

using UnityEngine;

namespace Needle.Engine.Components.Experimental
{
    public abstract class Player : MonoBehaviour
    {
        public void intialize(bool @findModules) { }
        public void addAllModules() { }
        public void tryConstructModule(object @type) { }
        public void addModule(PlayerModule @module) { }
        public void removeModule(PlayerModule @module) { }
        public void awake() { }
        public void earlyUpdate() { }
        public void update() { }
        public void lateUpdate() { }
        public void onBeforeRender() { }
    }
}