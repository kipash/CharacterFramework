import { Object3D, PerspectiveCamera,Vector3 } from "three";

import { Player } from "../../framework/Player.js";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { Camera, ClearFlags, GameObject, serializable } from "@needle-tools/engine";

/** basic character camera that can construct itself */
export class PlayerCamera extends PlayerModule {

    get type() { return PlayerModuleType.camera; }

    @serializable(Camera)
    camera?: Camera;

    protected cameraObject?: GameObject;
    protected origin: Vector3 = new Vector3();

    initialize(character: Player): void {
        super.initialize(character);

        this.camera ??= this.gameObject.getComponentInChildren(Camera)!;
        this.cameraObject ??= this.camera?.gameObject;
        if (this.cameraObject) {
            this.origin.copy(this.cameraObject.worldPosition);
        }

        if (this.player.isLocalPlayer)
            this.context.setCurrentCamera(this.camera);

        this.player.onRoleChanged.addEventListener(this.onRoleChanged);
    }

    onDestroy(): void {
        this.player?.onRoleChanged?.removeEventListener(this.onRoleChanged);
    }

    private onRoleChanged = (isLocalPlayer: boolean) => {
        // hide camera when not a local player
        if (this.cameraObject) {
            this.cameraObject.visible = isLocalPlayer;
        }
    }

    onDynamicallyConstructed(): void {
        // create camera if not present
        let cam = this.gameObject.getComponentInChildren(Camera);
        if (!cam) {
            const camObj = new PerspectiveCamera();

            cam = GameObject.addNewComponent(camObj, Camera);

            // Add 180° rotation to correct the flipped Z (?)
            camObj.rotateZ(Math.PI);

            cam.name = "Character Camera (Automatic)";
            cam.clearFlags = ClearFlags.Skybox;
            cam.cullingMask = -1;
            cam.nearClipPlane = 0.01;
            cam.farClipPlane = 150;
            cam.fieldOfView = 60;
            cam.sourceId = this.sourceId;

            this.gameObject.add(camObj);
        }

        this.camera = cam;
        this.origin.copy(cam.gameObject.position);
        this.cameraObject = cam.gameObject;
    }

    protected calculateYRotation(object: Object3D): number {
        //adjust Y to reflect the current rotation
        const charFwd = object.getWorldDirection(new Vector3());
        charFwd.y = 0; // flatten
        charFwd.normalize();

        // calculate signed angle
        const sign = _right.dot(charFwd) > 0 ? 1 : -1;
        return _forward.angleTo(charFwd) * sign;
    }
}

const _forward = new Vector3(0, 0, 1);
const _right = new Vector3(1, 0, 0);