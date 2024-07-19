import { serializable } from "@needle-tools/engine";
import { Player } from "../../framework/Player.js";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { PointerLock } from "./PointerLock.js";

export type CommonCharacterInput_Scheme = {
    moveDeltaX?: number;
    moveDeltaY?: number;
    lookDeltaX?: number;
    lookDeltaY?: number;
    scrollDeltaY?: number;
    jump?: boolean;
    sprint?: boolean;
    isCursorLocked?: boolean;
}

/** Gather inputs for movement, look, jump, sprint and zoom */
export class DesktopCharacterInput extends PlayerModule {

    @serializable()
    lockCursor: boolean = true;

    @serializable()
    rawMouseWhileLocked: boolean = true;

    @serializable()
    moveLeftKeys: string[] = ["a", "ArrowLeft"];

    @serializable()
    moveRightKeys: string[] = ["d", "ArrowRight"];

    @serializable()
    moveForwardKeys: string[] = ["w", "ArrowUp"];

    @serializable()
    moveBackwardKeys: string[] = ["s", "ArrowDown"];

    @serializable()
    jumpKeys: string[] = ["Space"];

    @serializable()
    sprintKeys: string[] = ["Shift"];

    @serializable()
    dragOrLockPointerId: number = 0;

    @serializable()
    jumpAllowHold: boolean = true;

    protected pointerLock?: PointerLock;

    get type() { return PlayerModuleType.input; }

    protected get inputData() { return this.frameData as CommonCharacterInput_Scheme; }
    protected get input() { return this.context.input; }

    initialize(character: Player): void {
        super.initialize(character);

        this.pointerLock = new PointerLock(this.context.domElement, this.rawMouseWhileLocked);
    }

    onDestroy(): void {
        this.pointerLock?.dispose();
    }

    updateInput(): void {
        this.jumpInput();
        this.sprintInput();
        this.handleLock();
        this.lookInput();
        this.scrollInput();
        this.moveInput();
    }

    protected jumpInput(): void {
        this.inputData.jump ||= this.jumpAllowHold ? this.areKeysPressed(this.jumpKeys) : this.areKeysDown(this.jumpKeys);
    }

    protected sprintInput(): void {
        this.inputData.sprint ||= this.areKeysPressed(this.sprintKeys);
    }

    protected handleLock(): void {
        const lockInput = this.input.getPointerPressed(this.dragOrLockPointerId) && this.input.getIsMouse(this.dragOrLockPointerId);
        if (this.lockCursor && !PointerLock.IsLocked && lockInput) {
            this.pointerLock?.lock();
        }
        this.inputData.isCursorLocked = PointerLock.IsLocked;
    }

    protected lookInput(): void {
        this.inputData.lookDeltaX ??= 0;
        this.inputData.lookDeltaY ??= 0;

        if (this.input.getIsMouse(this.dragOrLockPointerId) && (PointerLock.IsLocked || this.input.getPointerPressed(this.dragOrLockPointerId))) {
            const mouseDelta = this.input.getPointerPositionDelta(this.dragOrLockPointerId)!;
            this.inputData.lookDeltaX += mouseDelta.x / this.context.domWidth;
            this.inputData.lookDeltaY -= mouseDelta.y / this.context.domHeight; // y is inverted
        }
    }

    protected scrollInput(): void {
        this.inputData.scrollDeltaY ??= 0;
        this.inputData.scrollDeltaY += this.input.getMouseWheelDeltaY(0);
    }

    protected moveInput(): void {
        this.inputData.moveDeltaX ??= 0;
        this.inputData.moveDeltaY ??= 0;

        // not using else if to allow user to negate the movement which is more intuitive
        // then choosing one input as more dominant.
        if (this.areKeysPressed(this.moveBackwardKeys))
            this.inputData.moveDeltaY -= 1;
        if (this.areKeysPressed(this.moveForwardKeys))
            this.inputData.moveDeltaY += 1;
        if (this.areKeysPressed(this.moveRightKeys))
            this.inputData.moveDeltaX += 1;
        if (this.areKeysPressed(this.moveLeftKeys))
            this.inputData.moveDeltaX -= 1;
    }

    // ---- helper functions ----

    protected areKeysPressed(keys: string[]): boolean {
        for (const i in keys) {
            const key = keys[i];
            if (this.context.input.isKeyPressed(key)) {
                return true;
            }
        }

        return false;
    }
    protected areKeysDown(keys: string[]): boolean {
        for (const i in keys) {
            const key = keys[i];
            if (this.context.input.isKeyDown(key)) {
                return true;
            }
        }

        return false;
    }
}
