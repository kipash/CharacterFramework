import { Quaternion,Vector3 } from "three";

import { Player } from "../../framework/Player.js";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { CommonCharacterInput_Scheme } from "../input/DesktopCharacterInput.js";
import { CapsuleCollider, CharacterController, CollisionDetectionMode, ICollider, Mathf, PhysicsMaterial, PhysicsMaterialCombine, Rigidbody, serializable } from "@needle-tools/engine";

export type CharacterPhysics_Scheme = {
    characterIsGrounded?: boolean;
    characterIsJumping?: boolean;
    characterDirection?: Vector3;
    characterSpeed?: number;
    characterVelocity?: Vector3;
    /** True if the character is receiving input */
    isMoving?: boolean;
    /** The last time the character received input */
    lastMovingTime?: number;
}

export enum CharacterPhysics_MovementMode {
    Move,
    Turn
}

/** Character physics that should fufil majority of use cases */
export class CharacterPhysics extends PlayerModule {
    get type() { return PlayerModuleType.physics; }

    @serializable()
    movementMode: CharacterPhysics_MovementMode = CharacterPhysics_MovementMode.Move;

    @serializable(CharacterController)
    controller?: CharacterController;

    /* @serializable()
    movementSpeed: number = 28; */

    /* @serializable()
    sprintModifier: number = 1.5; */

    /* @serializable()
    jumpSpeed: number = 10; */

    @serializable()
    extraGravityForce: number = 4;

    @serializable()
    groundingForce: number = 6;

    @serializable()
    groundDrag: number = .9;

    @serializable()
    moveDrag: number = 5;

    @serializable()
    airbordDrag: number = 0;

    @serializable()
    idleDrag: number = 0;

    @serializable()
    desiredAirbornSpeed: number = 5;

    @serializable()
    airbornInputMultiplier: number = 1;

    @serializable()
    turnSpeed: number = 20;

    @serializable()
    frictionIdle: number = 50;

    @serializable()
    frictionMove: number = .5;

    @serializable()
    frictionAirborn: number = 0;

    @serializable()
    dominanceGroup: number = 0;    

    get isGrounded() { return this.controller?.isGrounded ?? false; }

    private _hasStartedFalling: boolean = false;
    get hasStartedFalling() { return this._hasStartedFalling }

    private _hasStartedLanding: boolean = false;
    get hasStartedLanding() { return this._hasStartedLanding; }

    // temp vectors to prevent extra alocations
    private moveDir = new Vector3();
    private fwdDir = new Vector3();
    private wFwdDir = new Vector3(0, 0, -1);
    private upDir = new Vector3(0, 1, 0);
    private rightDir = new Vector3();
    private jumpVec = new Vector3();
    private zeroValue = new Vector3();

    private tempVec = new Vector3();
    private tempRot = new Quaternion();

    private groundedLastFrame: boolean = false;

    private rotationBuffer!: Quaternion;
    private collider!: ICollider | null;
    private sqrtWorldSale = 1;

    onDynamicallyConstructed(): void {
        // add or create CharacterController
        this.controller ??= this.gameObject.getComponent(CharacterController)!;
        if (!this.controller) {
            this.controller = this.gameObject.addNewComponent(CharacterController)!;
            this.controller.center.y = 1;
        }

        // add or create CapsuleCollider
        this.collider = this.gameObject.getComponent(CapsuleCollider);
        if(!this.collider)  {
            this.gameObject.addComponent(CapsuleCollider);
            this.collider = this.gameObject.getComponent(CapsuleCollider)!;
        }
    }

    initialize(character: Player): void {
        super.initialize(character);
        
        this.controller ??= this.gameObject.getComponent(CharacterController)!;

        this.rotationBuffer = new Quaternion();

        // setup Rigidbody
        if (this.controller) {
            const rb = this.controller.rigidbody;
            rb.autoMass = false; // make it more consistent
            rb.mass = 1.3; // TODO: odd stuff happens when mass is 100
            rb.dominanceGroup = this.dominanceGroup; 
            rb.collisionDetectionMode = CollisionDetectionMode.Continuous;

            this.groundedLastFrame = this.controller.isGrounded;
        }

        this.collider ??= this.gameObject.getComponent(CapsuleCollider);
        if (this.collider) {
            // Define default physics material, without it, the controller sticks to walls when user is moving against them
            // TODO: consider creating the character out of 2 colliders, one sticky for ground contacts and one slippery for walls
            this.collider.sharedMaterial = {
                dynamicFriction: this.frictionIdle,
                bounciness: 0,
                frictionCombine: PhysicsMaterialCombine.Average,
                bounceCombine: PhysicsMaterialCombine.Average
            } as PhysicsMaterial;

            this.context.physics.engine?.getBody(this.collider) 
        }

        this.player.onRoleChanged.addEventListener(this.onRoleChanged);
    }

    onDestroy(): void {
        this.player?.onRoleChanged?.removeEventListener(this.onRoleChanged);
    }

    private onRoleChanged = (isLocalPlayer: boolean) => {
        const rb = this.controller?.rigidbody;
        if (rb) rb.isKinematic = !isLocalPlayer;
    }

    private moveX = 0;
    private moveY = 0;
    private moveSpeed = 0;
    private jumpSignal = false;
    private jumpSpeed = 0;

    earlyUpdate() {
        if (!this.canUpdate) return;

        this.moveX = 0;
        this.moveY = 0;
        this.moveSpeed = 0;
        this.jumpSignal = false;
        this.jumpSpeed = 0;
    }

    jump(jumpSpeed: number) {
        this.jumpSignal = true;
        this.jumpSpeed = jumpSpeed;
    }

    move(x: number, y: number, speed: number): void {
        if (!this.controller) return;

        // get world scale
        const wScale = this.player.gameObject.worldScale;
        const scale = Math.min(wScale.x, wScale.y, wScale.z);
        this.sqrtWorldSale = Math.sqrt(scale);

        this.moveX = x;
        this.moveY = y;
        this.moveSpeed = speed;
    }

    onBeforeRender(): void {
        if (!this.canUpdate) return;

        this._hasStartedLanding = this.groundedLastFrame === false && this.isGrounded === true;
        this._hasStartedFalling = this.groundedLastFrame === true && this.isGrounded === false;
    
        this.handlePhysics(this.moveX, this.moveY, this.jumpSignal, this.moveSpeed, this.jumpSpeed);

        // save ground state for next frame
        this.groundedLastFrame = this.controller?.isGrounded ?? false;
    }

    forceSetRotation(rotation: Quaternion): void {
        this.rotationBuffer.copy(rotation);
    }

    private handlePhysics(x: number, y: number, jump: boolean, moveSpeed: number, jumpSpeed: number, onJump?: () => void) {
        if (!this.controller) return;

        const state = this.constantData as CharacterPhysics_Scheme;
        const deltaTime = this.context.time.deltaTime;

        const rigidbody = this.controller.rigidbody;
        const mass = rigidbody.mass;

        const scaledMovementSpeed = this.sqrtWorldSale * moveSpeed;
        const scaledAirbornSpeed = this.sqrtWorldSale * this.desiredAirbornSpeed;
        const scaledJumpSpeed = this.sqrtWorldSale * jumpSpeed;

        // is there any move input
        const isInput = x >= .01 || x <= -.01 || y >= .01 || y <= -.01;

        // clamp input so diagonal movement isn't faster
        this.moveDir.set(-x, 0, y).normalize();
        x = this.moveDir.x;
        y = this.moveDir.z;

        // update state
        state.isMoving = isInput;
        if (state.isMoving) state.lastMovingTime = this.context.time.time;
        state.characterIsGrounded = this.controller.isGrounded;

        // get character forward direction
        this.gameObject.getWorldDirection(this.fwdDir)

        if (this.movementMode == CharacterPhysics_MovementMode.Move) {
            // calculate directional vectors
            //this.gameObject.getWorldDirection(this.fwdDir);
            this.rightDir.crossVectors(this.upDir, this.fwdDir);

            // calculate movement direction
            this.moveDir.set(0, 0, 0);

            this.moveDir.add(this.fwdDir.multiplyScalar(y));
            this.moveDir.add(this.rightDir.multiplyScalar(x));

            // clamp the vector so diagonal movement isn't faster
            this.moveDir.clampLength(0, 1);

            // apply speed and other properties to the input direction
            this.moveDir.multiplyScalar(mass * scaledMovementSpeed * deltaTime);
        }
        else if (this.movementMode == CharacterPhysics_MovementMode.Turn && state.characterDirection) {
            // get global forward direction
            const fwd = state.characterDirection!;

            // make sure it is flat
            fwd.y = 0;
            fwd.normalize();

            // rotate input
            this.tempRot.setFromUnitVectors(this.wFwdDir, fwd);
            this.moveDir.applyQuaternion(this.tempRot);

            // create rotation
            this.tempRot.setFromUnitVectors(this.wFwdDir, this.moveDir);

            // smooth rotation via an intermediate buffer
            this.player.gameObject.quaternion.slerp(this.rotationBuffer, deltaTime * this.turnSpeed);

            // get updated character forward direction
            this.player.gameObject.getWorldDirection(this.fwdDir)

            // apply rotation only with input
            if (isInput) {
                this.rotationBuffer.slerp(this.tempRot, deltaTime * this.turnSpeed);
            }

            // calcualte final move vector
            const acceleration = mass * scaledMovementSpeed * deltaTime;
            this.moveDir.negate();
            this.moveDir.multiplyScalar(acceleration);
        }

        // handle jump
        state.characterIsJumping = jump;
        if (state.characterIsJumping) {
            // calculate & apply impulse vector
            this.jumpVec.set(0, 1, 0);
            this.jumpVec.multiplyScalar(scaledJumpSpeed * mass);

            // reset Y velcoity
            const vel = rigidbody.getVelocity();
            vel.y = 0;
            rigidbody.setVelocity(vel);

            // apply impulse
            rigidbody.applyImpulse(this.jumpVec);

            // callback
            onJump?.();
        }

        // get velocity to calculate input penalty
        let velocity = this.getVelocity(rigidbody, true, false, true);

        // penalize input when airborn
        if (!this.controller.isGrounded) {
            //calculate speed penatly
            const velocityStep = scaledAirbornSpeed * 0.25;
            const velocityDifference = 1 - Mathf.clamp01(Mathf.remap(velocity.length(), scaledAirbornSpeed - velocityStep, scaledAirbornSpeed + velocityStep, 0, 1));
            // calculate direction penalty
            const directionDifference = 1 - Mathf.clamp(velocity.dot(this.moveDir), 0, .7);
            // combine penalties and apply to input
            const penaltyFactor = Mathf.clamp01(velocityDifference * directionDifference);
            this.moveDir.multiplyScalar(penaltyFactor);
        }

        // choose drag setting
        let drag = 0;
        if (this.controller.isGrounded) {
            if (isInput)
                drag = this.moveDrag;
            else
                drag = this.groundDrag;
        }
        else if (!this.controller.isGrounded && isInput)
            drag = this.airbordDrag;
        else if (!isInput)
            drag = this.idleDrag;

        // apply drag only when it changes
        if (Math.abs(rigidbody.drag - drag) > .01) {
            rigidbody.drag = drag;
        }

        // set friction
        if (this.collider?.sharedMaterial) {
            let friction = 0;

            if(!this.controller.isGrounded) 
                friction = this.frictionAirborn;
            else if(isInput) 
                friction = this.frictionMove;
            else 
                friction = this.frictionIdle;

            this.collider.sharedMaterial.dynamicFriction = friction;
            this.collider.updatePhysicsMaterial();
        }

        // apply grounding force
        const downwardForce = this.controller.isGrounded ? this.groundingForce : this.extraGravityForce;
        this.moveDir.y -= downwardForce * mass * deltaTime;

        // move the character controller
        rigidbody.applyImpulse(this.moveDir);

        // calculate speed based on velocity without Y
        velocity = this.getVelocity(rigidbody, true, false, true);
        // substract the current velocity of the ground on which the character is standing on
        velocity.sub(this.controller.contactVelocity)
        velocity.y = 0; // ignore Y

        state.characterSpeed = velocity.length();

        // save velocity
        state.characterVelocity ??= new Vector3();
        state.characterVelocity.copy(velocity);
    }

    private tempVel = new Vector3();
    private getVelocity(rigidbody: Rigidbody, x: boolean = true, y: boolean = true, z: boolean = true): Vector3 {
        this.tempVel.copy(rigidbody.getVelocity());

        if (!x) this.tempVel.x = 0;
        if (!y) this.tempVel.y = 0;
        if (!z) this.tempVel.z = 0;

        return this.tempVel;
    }
}
