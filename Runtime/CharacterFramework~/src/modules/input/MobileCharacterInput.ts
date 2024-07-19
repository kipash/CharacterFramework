import { Object3D, Vector2 } from "three";

import { Player } from "../../framework/Player.js";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { CommonCharacterInput_Scheme } from "./DesktopCharacterInput.js";
import { Joystick } from "./Joystick.js";
import { GameObject, isMobileDevice, PointerType, serializable } from "@needle-tools/engine";

/** Gather inputs for movement, look, jump, sprint and zoom */
export class MobileCharacterInput extends PlayerModule {
    @serializable()
    mobileOnly: boolean = true;

    @serializable()
    sprintJoystickThreshold: number = 0.7;

    @serializable()
    pinchSensitvity: number = 1.5;

    // can't be serialized due to multiplayer
    protected _moveJoystick?: Joystick;
    //@nonSerialized
    get moveJoystick(): Joystick | undefined { return this._moveJoystick; }

    get type() { return PlayerModuleType.input; }

    protected get inputData() { return this.frameData as CommonCharacterInput_Scheme; }
    protected get input() { return this.context.input; }

    protected _moveJoyDelta = new Vector2();
    initialize(character: Player): void {
        super.initialize(character);

        if (!this._moveJoystick) {
            const joystickObj = new Object3D();
            joystickObj.name = "MobileJoystick - move";

            this._moveJoystick = GameObject.addComponent(joystickObj, Joystick, undefined, { callAwake: true});

            this.gameObject.add(joystickObj);
        }

        if (this._moveJoystick) {
            this._moveJoystick.onValueChange.addEventListener((delta, _) => {
                this._moveJoyDelta.copy(delta);
                this._moveJoyDelta.multiplyScalar(1 / this.sprintJoystickThreshold);
            });

            this._moveJoystick.enabled = (!this.mobileOnly || isMobileDevice()) && this.player.isLocalPlayer;

        }
    }

    protected lastPinchMagnitude = -1;
    protected isPinching = false;
    updateInput(): void {
        this.moveInput();
        this.lookInput();
        this.scrollInput();
        this.jumpInput();
    }

    protected moveInput() {
        this.inputData.sprint ??= false;
        this.inputData.sprint ||= this._moveJoyDelta.length() > 0.9;

        this.inputData.moveDeltaX ??= 0;
        this.inputData.moveDeltaY ??= 0;
        this._moveJoyDelta.normalize();
        this.inputData.moveDeltaX += this._moveJoyDelta.x;
        this.inputData.moveDeltaY += this._moveJoyDelta.y;
    }

    protected lookInput() {
        this.inputData.lookDeltaX ??= 0;
        this.inputData.lookDeltaY ??= 0;

        if (this.input.getTouchesPressedCount() == 1 && !this.isPinching) {
            for (const i of this.context.input.foreachPointerId(PointerType.Touch)) {
                const delta = this.input.getPointerPositionDelta(i)!;
                this.inputData.lookDeltaX += delta.x / this.context.domWidth;
                this.inputData.lookDeltaY -= delta.y / this.context.domHeight; // y is inverted
            }
        }
    }

    protected scrollInput() {
        this.inputData.scrollDeltaY ??= 0;
        if (this.input.getTouchesPressedCount() == 2) {
            this.isPinching = true;
            const p1 = this.input.getPointerPosition(0)!;
            const p2 = this.input.getPointerPosition(1)!;

            const magnitude = p1.distanceTo(p2);
            if (this.lastPinchMagnitude == -1) {
                this.lastPinchMagnitude = magnitude;
            }
            const delta = (this.lastPinchMagnitude - magnitude) * this.pinchSensitvity;
            this.inputData.scrollDeltaY += delta;

            this.lastPinchMagnitude = magnitude;

            // disable look if zooming
            if (delta != 0) {
                this.inputData.lookDeltaX = 0;
                this.inputData.lookDeltaY = 0;
            }
        }
        else {
            this.lastPinchMagnitude = -1;
        }

        // reset pinching 
        if (this.input.getTouchesPressedCount() == 0)
            this.isPinching = false;
    }

    protected jumpInput() {        
         this.inputData.jump ??= false;
         for (const i of this.context.input.foreachPointerId(PointerType.Touch)) {
            this.inputData.jump ||= this.input.getPointerDoubleClicked(i);
         }
    }
}
