using System;

namespace Needle.Engine.Components.Experimental
{
    public enum ViewMode
    {
        FirstPerson = 1 << 0,
        ThirdPerson = 1 << 1,
    }

    [Flags]
    public enum ViewModeFlags
    {
        FirstPerson = 1 << 0,
        ThirdPerson = 1 << 1
    }
}