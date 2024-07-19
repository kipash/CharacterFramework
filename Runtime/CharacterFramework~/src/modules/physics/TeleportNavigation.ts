import { Vector2, Vector3 } from "three";
import * as THREE from "three";

import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { SimplePointerInput_Scheme } from "../input/SimplePointerInput.js";
import { getTempVector, Mathf, serializable, setWorldPosition } from "@needle-tools/engine";

export class GalleryPhysics_Scheme {
    safePosition?: Vector3;
    safeNormal?: Vector3;
}

export class TeleportNavigation extends PlayerModule {
    get type(): PlayerModuleType { return PlayerModuleType.physics; }

    @serializable()
    maxRaycastDistance: number = 20;

    @serializable()
    positionSmoothing: number = 3;

    @serializable()
    maxSlope: number = 45;

    private targetPosition: Vector3 = new Vector3();

    start(): void {
        this.targetPosition.copy(this.worldPosition);
    }

    update(): void {
        if (!this.canUpdate) return;
        
        const cam = this.context.mainCamera!;
        const inputstate = this.frameData as SimplePointerInput_Scheme;
        const physicsState = this.frameData as GalleryPhysics_Scheme;

        const pos = inputstate.pointerPositionRC ?? new Vector2();
        const safePos = this.getSafeTargetFromPointer(cam, pos);
        physicsState.safePosition = safePos?.pos;
        physicsState.safeNormal = safePos?.normal;

        // has clicked to teleport
        if (inputstate.hasClicked === true && safePos?.pos)
            this.targetPosition.copy(safePos?.pos); // set target

        // transition current pos to target
        this.updatePosition();
    }

    private tempPos = new Vector3();
    // TODO: add sine out easing
    /** transition current world position to target position */
    updatePosition() {
        this.tempPos.copy(this.worldPosition);
        this.tempPos.lerp(this.targetPosition, this.positionSmoothing * this.context.time.deltaTime);
        setWorldPosition(this.player.gameObject, this.tempPos);
    }

    private refUp = new Vector3(0, 1, 0);
    // TODO: calculate if camera would collide into something
    // TODO: add case when user clicks on a wall -> Move infront of it, not into it
    /** Calcualte safe world position from screen point  */
    getSafeTargetFromPointer(camera: THREE.Camera, screenPositionRC: Vector2): { pos: Vector3, normal: Vector3 } | null {
        
        // calculate world position of pointer in depth 1 from camera
        const pointerPos = getTempVector().set(screenPositionRC.x, screenPositionRC.y, -1).unproject(camera);

        // get camera world position
        const cameraPos = camera.getWorldPosition(getTempVector());

        // calcualte direction from camera to pointer
        const direction = getTempVector().copy(pointerPos).sub(cameraPos).normalize();

        // get target
        const result = this.context.physics.engine?.raycastAndGetNormal(pointerPos, direction, { maxDistance: this.maxRaycastDistance });
        if (result && result.normal) {
            const angle = this.refUp.angleTo(result.normal);
            if(angle > Mathf.Deg2Rad * this.maxSlope)
                return null;
            else
                return { pos: result.point, normal: result.normal }; // use hit result
        }
        else { // no hit
            return null;
        }
    }
}