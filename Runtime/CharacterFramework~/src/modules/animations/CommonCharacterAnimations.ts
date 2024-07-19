import { Animator, serializable } from "@needle-tools/engine";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { CharacterPhysics_Scheme } from "../physics/CharacterPhysics.js";

/** Drives animator based on CharacterPhysics module */
export class CommonCharacterAnimations extends PlayerModule {
    @serializable(Animator)
    animator?: Animator;

    @serializable()
    jumpName: string = "jump";

    @serializable()
    fallingName: string = "falling";

    @serializable()
    startFallName: string = "startFall";

    @serializable()
    fallAnimDelay: number = 0.2;

    @serializable()
    idleName: string = "idling";

    @serializable()
    walkName: string = "walking";

    @serializable()
    sprintName: string = "sprinting";

    @serializable()
    speedMultiplier: string = "speedMultiplier";

    // @tooltip("Minimum speed to enter walk animation")
    @serializable()
    minWalkSpeed: number = 1;

    // @tooltip("Speed of the walk animation")
    @serializable()
    baseWalkSpeed: number = 2; // based on mixamo walk anim

    // @tooltip("Minimum speed to enter sprint animation")
    @serializable()
    minSprintSpeed: number = 6;

    // @tooltip("Speed of the sprint animation")
    @serializable()
    baseSprintSpeed: number = 5.25; // based on mixamo sprint anim

    @serializable()
    adjustWithScale: boolean = true;

    get type() { return PlayerModuleType.generic; }

    private hasJumped: boolean = false;
    private hasStartedFalling: boolean = false;

    private startFallTime: number = 0;
    private previousGrounded: boolean | null | undefined = undefined;
    onBeforeRender() {
        if (!this.canUpdate) return;
        if (!this.animator) return;

        const physicsState = this.constantData as CharacterPhysics_Scheme;
        const time = this.context.time;

        // get world scale
        const wScale = this.player.gameObject.worldScale;
        const scale = Math.min(wScale.x, wScale.y, wScale.z);
        const linScale = this.adjustWithScale ? scale : 1;
        const sqrtScale = this.adjustWithScale ? Math.sqrt(scale) : 1;

        const scaledMinWalkSpeed = this.minWalkSpeed * sqrtScale;
        const scaledMinSprintSpeed = this.minSprintSpeed * sqrtScale;
        const scaledBaseWalkSpeed = this.baseWalkSpeed * linScale;
        const scaledBaseSprintSpeed = this.baseSprintSpeed * linScale;

        // reset hasJumped
        if(physicsState.characterIsGrounded === true)
            this.hasJumped = false;

        if(this.jumpName != "" && (physicsState.characterIsJumping ?? false)) {
            this.hasJumped = true;
            this.animator.setTrigger(this.jumpName);
        }

        // idle, walk, sprint
        const speed = physicsState.characterSpeed;
        if(speed !== undefined) {
            const isIdle = speed <= scaledMinWalkSpeed;
            const isWalking = speed > scaledMinWalkSpeed && speed <= scaledMinSprintSpeed;
            const isSprinting = speed > scaledMinSprintSpeed;

            if(this.idleName != "")
                this.animator.setBool(this.idleName, isIdle);

            if(this.walkName != "")
                this.animator.setBool(this.walkName, isWalking);

            if(this.sprintName != "")
                this.animator.setBool(this.sprintName, isSprinting);

            const multipler = isSprinting ? speed / scaledBaseSprintSpeed : speed / scaledBaseWalkSpeed;

            if(this.speedMultiplier != "")
                this.animator.setFloat(this.speedMultiplier, multipler);
        }

        // has data to drive falling animations
        const hasFallingData = physicsState.characterSpeed != null && 
                               physicsState.characterVelocity != null &&
                                 physicsState.characterIsGrounded != null;

        if(hasFallingData) {
            const isFallingDown = !physicsState.characterIsGrounded;
            const isStartingToFall = this.previousGrounded === true && physicsState.characterIsGrounded === false;
            const isLanding = this.previousGrounded === false && physicsState.characterIsGrounded === true;

            if(isStartingToFall || !isFallingDown)
                this.startFallTime = time.time;

            if(this.fallingName != "")
                this.animator.setBool(this.fallingName, isFallingDown);

            const eligibleForFall = time.time - this.startFallTime > this.fallAnimDelay;
            if(this.startFallName != "" && eligibleForFall && isFallingDown && !this.hasJumped) {
                this.startFallTime = Number.MAX_SAFE_INTEGER;
                this.animator.setTrigger(this.startFallName);
            }
        }
        
        // cache the previously grounded result to calculate start fall trigger
        this.previousGrounded = physicsState.characterIsGrounded;
    }
}