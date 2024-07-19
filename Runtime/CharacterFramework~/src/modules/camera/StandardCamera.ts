import { MathUtils,Quaternion, Vector2, Vector3 } from "three";

import { Player } from "../../framework/Player.js";
import { CommonCharacterInput_Scheme } from "../input/DesktopCharacterInput.js";
import { CharacterPhysics_Scheme } from "../physics/CharacterPhysics.js";
import { PlayerCamera } from "./PlayerCamera.js";
import { ViewModeFlags } from "./ViewMode.js";
import { getParam, Gizmos, Mathf, serializable } from "@needle-tools/engine";

const debug = getParam("debugcharacter");

/** Point of View camera that supports First and Third person view */
export class StandardCamera extends PlayerCamera {
    @serializable()
    distance: Vector2 = new Vector2(0.4, 6);

    @serializable()
    startDistance: number = 4;

    @serializable()
    offset: Vector3 = new Vector3(0, 1.6, 0);

    //@tooltip Clamp the up-down rotation of the camera
    @serializable()
    xRotClamp: Vector2 = new Vector2(-89, 89);

    @serializable()
    lookSensitivity: number = 4;

    @serializable()
    zoomSensitivity: number = 0.005;

    @serializable()
    enableFOVBoost: boolean = true;

    @serializable()
    sprintFOVSpeed: number = 5;

    @serializable()
    sprintVelocityThreshold: number = 6;

    @serializable()
    thirdPersonFovIncrease: number = 10;

    @serializable()
    thirdPersonFov: number = 60;

    @serializable()
    firstPersonFov: number = 80;

    @serializable()
    zoomSmoothing: number = 10;

    @serializable()
    enableLineOfSight: boolean = true;

    @serializable()
    lineOfSightOffset: number = 0.5;

    protected x: number = 0;
    protected y: number = 0;

    protected _currentDistance: number = 0;
    protected _currentDistanceGoal: number = 0;

    protected worldScale: number = 1;
    protected scaledDistance: Vector2 = new Vector2();

    initialize(character: Player): void {
        super.initialize(character);

        // detach camera
        const parent = this.player.gameObject.parent;
        if (parent && this.cameraObject) {
            this.cameraObject.removeFromParent();
            parent.add(this.cameraObject);
        }

        this.scaledDistance.copy(this.distance);
        this.y = this.calculateYRotation(this.player.gameObject);

        if(!this._person)
            this.switchPerson(ViewModeFlags.ThirdPerson);
        
        this.restoreDefault();
    }

    onDynamicallyConstructed(): void {
        super.onDynamicallyConstructed();
    }

    protected lookDeltaX: number = 0;
    protected lookDeltaY: number = 0;
    look(xDelta: number, yDelta: number): void {
        this.lookDeltaX = xDelta;
        this.lookDeltaY = yDelta;
    }

    protected scrollDelta: number = 0;
    zoom(scrollDelta) {
        this.scrollDelta = scrollDelta;
    }

    earlyUpdate(): void {
        this.lookDeltaX = 0;
        this.lookDeltaY = 0;
        this.scrollDelta = 0;
    }

    onBeforeRender(): void {
        if (!this.canUpdate) return;

        // update origin position for the cam pos calculation
        this.origin.copy(this.player.gameObject.worldPosition);

        if (this.context.isInXR) return;

        // migrate distance between scales updates
        const goalT = Mathf.clamp01(Mathf.inverseLerp(this.scaledDistance.x, this.scaledDistance.y, this._currentDistanceGoal));

        // get world scale
        const scaleVec = this.player.gameObject.worldScale;
        this.worldScale = Math.min(scaleVec.x, scaleVec.y, scaleVec.z);
        
        this.scaledDistance.copy(this.distance);
        
        this.scaledDistance.multiplyScalar(this.worldScale);

        // apply after change
        this._currentDistanceGoal = Mathf.lerp(this.scaledDistance.x, this.scaledDistance.y, goalT);

        this.handleZoom(this.scrollDelta);
        this.handleLook(this.lookDeltaX, this.lookDeltaY);
        this.handleLineOfSight();
        this.handleFOVBoost();
    }

    /** set distance based on scroll input */
    handleZoom(scrollDelta: number) {
        // annul input if in FPS mode
        if (this.person == ViewModeFlags.FirstPerson) {
            // set distance
            this._currentDistance = 0.001;

            // detect desired person
            this._desiredPerson = (scrollDelta > 0) ? ViewModeFlags.ThirdPerson : ViewModeFlags.FirstPerson;
        }
        else if (this.person == ViewModeFlags.ThirdPerson) {
            // add and clamp
            this._currentDistanceGoal += scrollDelta * this.zoomSensitivity;
            this._currentDistanceGoal = Mathf.clamp(this._currentDistanceGoal, this.distance.x, this.distance.y);

            // interpolate
            const t = this.zoomSmoothing * this.context.time.deltaTime;
            this._currentDistance = Mathf.lerp(this._currentDistance, this._currentDistanceGoal, t);

            // detect desired person
            this._desiredPerson = (this._currentDistanceGoal <= this.distance.x) ? ViewModeFlags.FirstPerson : ViewModeFlags.ThirdPerson;
        }
    }

    private tempQua1 = new Quaternion();
    private tempQua2 = new Quaternion();
    private tempVec1 = new Vector3();
    private tempVec2 = new Vector3();
    private refFwd = new Vector3(0, 0, 1);
    private refUp = new Vector3(0, 1, 0);
    private refRight = new Vector3(1, 0, 0);
    /** Move camera based on input */
    handleLook(lookX: number, lookY: number) {
        const dx = -lookY * this.lookSensitivity;
        const dy = -lookX * this.lookSensitivity;

        // add deltas to the state while clamping up-down rotation
        this.x = MathUtils.clamp(this.x + dx, Mathf.toRadians(this.xRotClamp.x), Mathf.toRadians(this.xRotClamp.y));
        this.y += dy;

        if (!this.cameraObject) return;

        // create vector behind the character
        this.tempVec1.set(0, 0, -this._currentDistance);

        // rotated it by the input
        this.tempQua1.setFromAxisAngle(this.refUp, this.y);
        this.tempQua2.setFromAxisAngle(this.refRight, this.x);
        const finalRot = this.tempQua1.multiply(this.tempQua2);
        this.tempVec1.applyQuaternion(finalRot);

        // copy offset
        this.tempVec2.copy(this.offset);
        this.tempVec2.x *= -1; // flip x
        this.tempVec2.applyAxisAngle(this.refUp, this.y); // rotate the offset

        // scale the offset by zoom
        const zoomFactor = Mathf.clamp01(Mathf.inverseLerp(this.distance.x, this.distance.y, this._currentDistance));
        this.tempVec2.x *= zoomFactor;
        this.tempVec2.z *= zoomFactor;

        // add object pos and offset
        this.tempVec1.add(this.origin);
        this.tempVec1.add(this.tempVec2);

        // apply position
        this.cameraObject.worldPosition = this.tempVec1;

        // calcualte lookAt direction and apply it
        this.tempVec1.copy(this.origin);
        this.tempVec1.add(this.tempVec2);
        if(debug) Gizmos.DrawWireSphere(this.tempVec1, .01, 0xffff00);
        this.cameraObject.lookAt(this.tempVec1);

        // in FPS mode apply rotation to the character as well
        if (this.person == ViewModeFlags.FirstPerson)
            this.player.gameObject.quaternion.setFromAxisAngle(this.refUp, this.y);

        // populate character direction
        const state = this.constantData as CharacterPhysics_Scheme;
        state.characterDirection ??= new Vector3();

        if (this._person == ViewModeFlags.FirstPerson)
            this.player.gameObject.getWorldDirection(state.characterDirection);
        else if (this._person == ViewModeFlags.ThirdPerson)
            this.cameraObject.getWorldDirection(state.characterDirection);
    }

    /** Adjust camera position if there is something in between the character and camera */
    handleLineOfSight() {
        if (!this.enableLineOfSight) return;
        if (!this.cameraObject || this.person == ViewModeFlags.FirstPerson) return;

        const physics = this.context.physics.engine!;

        // world positions
        const target = this.cameraObject.getWorldPosition(this.tempVec1);
        const origin = this.player.gameObject.getWorldPosition(this.tempVec2);
        origin.y += this.offset.y;

        const distance = target.distanceTo(origin);
        const direction = target.sub(origin).normalize();

        const result = physics.raycast(origin, direction, { maxDistance: distance });
        if (result) {
            const offsetDir = origin.sub(target).normalize();
            const savePoint = this.tempVec1.copy(result.point);
            savePoint.add(offsetDir.multiplyScalar(this.lineOfSightOffset));
            this.cameraObject.position.copy(savePoint);

            // TODO: when offset is present, the camera doesn't face the character anymore.
        }
    }

    /** Give better sense of speed by increasing the camera fov */
    handleFOVBoost() {
        if (!this.enableFOVBoost || this.person == ViewModeFlags.FirstPerson) return;

        const physicsState = this.constantData as CharacterPhysics_Scheme;
        const speed = physicsState.characterSpeed ?? 0;
        const deltaTime = this.context.time.deltaTime;

        const sprintFOV = this.thirdPersonFov + this.thirdPersonFovIncrease;
        const target = speed > this.sprintVelocityThreshold ? sprintFOV : this.thirdPersonFov;

        if (this.camera)
            this.camera.fieldOfView = Mathf.lerp(this.camera.fieldOfView ?? this.thirdPersonFov, target, this.sprintFOVSpeed * deltaTime);
    }

    setLook(x?: number, y?: number) {
        if (x != undefined) this.x = x;
        if (y != undefined) this.y = y;
    }

    protected _person: ViewModeFlags | null = ViewModeFlags.FirstPerson;
    /** Current person mode that is active */
    get person(): ViewModeFlags | null { return this._person; }

    protected _desiredPerson: ViewModeFlags = ViewModeFlags.FirstPerson;
    /** Person mode that the camera would like to be in */
    get desiredPerson(): ViewModeFlags { return this._desiredPerson; }

    /** Switch between FPS and TPS */
    switchPerson(mode: ViewModeFlags) {
        this._currentDistanceGoal = mode == ViewModeFlags.FirstPerson ? 0.001 : this.distance.x + 0.05;
        this._desiredPerson = this._person = mode;
        if (this.camera)
            this.camera.fieldOfView = mode == ViewModeFlags.FirstPerson ? this.firstPersonFov : this.thirdPersonFov;
    }

    /** Manually reset the state to desired default */
    restoreDefault() {
        this.y = this.calculateYRotation(this.player.gameObject);
        this._currentDistance = this._currentDistanceGoal = this.startDistance;
    }
}
