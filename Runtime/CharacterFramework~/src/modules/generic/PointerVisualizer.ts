import { Quaternion, Vector3 } from "three";

import { Player } from "../../framework/Player.js";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { SimplePointerInput_Scheme } from "../input/SimplePointerInput.js";
import { GalleryPhysics_Scheme } from "../physics/TeleportNavigation.js";
import { GameObject, serializable } from "@needle-tools/engine";

export class PointerVisualizer extends PlayerModule {
    get type(): PlayerModuleType { return PlayerModuleType.generic; }
    
    @serializable(GameObject)
    pointer?: GameObject;

    initialize(player: Player): void {
        super.initialize(player);
        this.player.onRoleChanged.addEventListener(this.onRoleChanged);
    }

    onDestroy(): void {
        super.onDestroy();
        this.player.onRoleChanged.removeEventListener(this.onRoleChanged);
    }

    private onRoleChanged = () => { 
        if(this.pointer) this.pointer.visible = this.player.isLocalPlayer;
    };

    private refUp = new Vector3(0, 1, 0);
    private tempQuaterion = new Quaternion();
    onBeforeRender(): void {
        if (!this.canUpdate) return;
        
        const physicsState = this.frameData as GalleryPhysics_Scheme;
        const inputState = this.frameData as SimplePointerInput_Scheme;

        if(!this.pointer) return;

        const hasData = physicsState.safePosition !== undefined && physicsState.safeNormal !== undefined && inputState.isPointerMouse !== undefined;
        this.pointer.visible = hasData && inputState.isPointerMouse === true;
        if (hasData) {
            this.pointer.worldPosition = physicsState.safePosition!;
            this.pointer.worldQuaternion = this.tempQuaterion.setFromUnitVectors(this.refUp, physicsState.safeNormal!);
        }
    }
}