using UnityEngine;

#pragma warning disable

namespace Needle.Engine.Components.Experimental
{
    public abstract class PlayerModule : MonoBehaviour
    {
        public virtual string? Description => null;
        public void initialize(Player @character) { }
        public void onDynamicallyConstructed() { }
        public void moduleEarlyUpdate() { }
        public void moduleUpdate() { }
        public void moduleLateUpdate() { }
        public void moduleOnBeforeRender() { }
    }
}