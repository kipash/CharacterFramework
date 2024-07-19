import { serializable, SyncedTransform } from "@needle-tools/engine";
import { Player } from "./framework/Player.js";
import { StandardCamera } from "./modules/camera/StandardCamera.js";
import { ViewModeFlags } from "./modules/camera/ViewMode.js";
import { CommonAvatar } from "./modules/generic/CommonAvatar.js";
import { SimplePointerInput } from "./modules/input/SimplePointerInput.js";
import { TeleportNavigation } from "./modules/physics/TeleportNavigation.js";

export class GalleryCharacter extends Player {
    @serializable()
    overrideModuleSettings: boolean = true;

    @serializable()
    headHeight: number = 1.6;

    @serializable()
    teleportationSpeed: number = 3;

    private camera?: StandardCamera;
    private avatar?: CommonAvatar;

    awake(): void {
        super.awake();

        this.camera = this.ensureModule(StandardCamera, mod => {
            if(this.overrideModuleSettings)
                mod.offset.set(0, this.headHeight, 0);
        });
        
        this.ensureModule(TeleportNavigation, mod => { 
            if(this.overrideModuleSettings)
                mod.positionSmoothing = this.teleportationSpeed;
        });

        this.ensureModule(SimplePointerInput);
        this.avatar = this.gameObject.getComponentInChildren(CommonAvatar)!;
    }

    protected initialize(findModules?: boolean): void {
        super.initialize(findModules);

        this.camera?.switchPerson(ViewModeFlags.FirstPerson);
        this.avatar?.setPerson(ViewModeFlags.FirstPerson);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();
    }
}