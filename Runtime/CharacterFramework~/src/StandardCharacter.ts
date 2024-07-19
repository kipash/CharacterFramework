import { serializable, SyncedTransform } from "@needle-tools/engine";
import { FiniteStateMachine } from "./framework/FiniteStateMachine.js";
import { Player } from "./framework/Player.js";
import { CommonCharacterAnimations } from "./modules/animations/CommonCharacterAnimations.js";
import { CommonCharacterAudio } from "./modules/audio/CommonCharacterAudio.js";
import { StandardCamera } from "./modules/camera/StandardCamera.js";
import { ViewModeFlags } from "./modules/camera/ViewMode.js";
import { CommonAvatar } from "./modules/generic/CommonAvatar.js";
import { CommonCharacterInput_Scheme, DesktopCharacterInput } from "./modules/input/DesktopCharacterInput.js";
import { MobileCharacterInput } from "./modules/input/MobileCharacterInput.js";
import { CharacterPhysics, CharacterPhysics_MovementMode } from "./modules/physics/CharacterPhysics.js";

/** Character that support FPS and TPS modes */
export class StandardCharacter extends Player {

    @serializable()
    defaultViewMode: ViewModeFlags = ViewModeFlags.ThirdPerson;

    @serializable()
    allowedViewModes: ViewModeFlags = ViewModeFlags.All;

    @serializable()
    walkSpeed: number = 28;

    @serializable()
    sprintSpeed: number = 50;

    @serializable()
    jumpSpeed: number = 8;

    @serializable()
    cameraXOffset: number = 1;

    @serializable()
    cameraYOffset: number = 1.6;

    @serializable()
    enableSprint: boolean = true;

    @serializable()
    enableLineOfSight: boolean = true;

    protected camera!: StandardCamera;
    protected physics!: CharacterPhysics;
    protected avatar?: CommonAvatar;
    protected audio?: CommonCharacterAudio;
    protected animation?: CommonCharacterAnimations;

    movementStateMachine!: FiniteStateMachine;

    protected get standardInput (): CommonCharacterInput_Scheme {
        return this.frameData as CommonCharacterInput_Scheme;
    }

    // @nonSerialized
    set person(mode: ViewModeFlags | null) { if (mode) this.switchPerson(mode); }
    // @nonSerialized
    get person(): ViewModeFlags | null { return this.camera?.person; }

    initialize(findModules?: boolean): void {
        // create required modules
        this.ensureModule(DesktopCharacterInput);
        this.ensureModule(MobileCharacterInput);
        this.camera = this.ensureModule(StandardCamera, mod => {
            mod.offset.x = this.cameraXOffset * this.gameObject.worldScale.x;
            mod.offset.y = this.cameraYOffset * this.gameObject.worldScale.y;
            mod.enableLineOfSight = this.enableLineOfSight;
        });
        this.physics = this.ensureModule(CharacterPhysics, mod => {
            mod.desiredAirbornSpeed = this.jumpSpeed / 2;
        });

        // get optional modules
        this.avatar = this.gameObject.getComponentInChildren(CommonAvatar)!;
        this.audio = this.gameObject.getComponentInChildren(CommonCharacterAudio)!;
        this.animation = this.gameObject.getComponentInChildren(CommonCharacterAnimations)!;

        super.initialize(findModules);

        // locate SyncedTransform and request ownership on local player
        if (this.isLocalPlayer)
            this.gameObject.getComponent(SyncedTransform)?.requestOwnership();

        if (!this.isAllowedPerson(this.defaultViewMode)) this.allowedViewModes |= this.defaultViewMode;
        this.switchPerson(this.defaultViewMode);
        this.camera?.restoreDefault();

        this.defineStates();
    }

    update(): void {
        super.update();
        
        if (!this.isInitialized) return;

        if (!this.camera || this.context.isInXR) return;

        if (this.camera.desiredPerson != this.camera.person)
            this.switchPerson(this.camera.desiredPerson);
    }

    protected isAllowedPerson(person: ViewModeFlags) {
        return (this.allowedViewModes & person) != 0;
    }

    protected switchPerson(newPerson: ViewModeFlags) {
        if (!this.physics || !this.camera) return;
        if (!this.isAllowedPerson(newPerson)) return;

        this.physics.movementMode = newPerson == ViewModeFlags.FirstPerson ? CharacterPhysics_MovementMode.Move : CharacterPhysics_MovementMode.Turn;
        this.physics.forceSetRotation(this.gameObject.quaternion); // set character rotation
        this.avatar?.setPerson(newPerson);
        this.camera.switchPerson(newPerson);
    }

    private defineStates(): void {
        const states = [
            {
                id: "idle",
                priority: -1, 
                update: () => {
                    this.look();
                },
                enterCondition: [ () => true ] 
            },
            {
                id: "walking",
                update: () => {
                    this.look();
                    this.move();
                },
                enterCondition: [ 
                    () => ((this.standardInput.moveDeltaX ?? 0) != 0 || (this.standardInput.moveDeltaY ?? 0) != 0), 
                    () => this.physics.isGrounded 
                ]
            },
            {
                id: "sprinting",
                priority: 1,
                update: () => {
                    this.look();
                    this.move();
                },
                enterCondition: [ 
                    () => ((this.standardInput.moveDeltaX ?? 0) != 0 || (this.standardInput.moveDeltaY ?? 0) != 0), 
                    () => this.physics.isGrounded,
                    () => (this.standardInput.sprint ?? false) && this.enableSprint
                ]
            },
            {
                id: "jump",
                priority: 2,
                update: () => {
                    this.look();
                    this.move();
                    this.jump();
                },
                enterCondition: [ () => (this.standardInput.jump ?? false) && this.physics.isGrounded ]
            },
            {
                id: "fall",
                priority: 3,
                update: () => {
                    this.look();
                    this.move();
                },
                enterCondition: [ () => this.physics.hasStartedFalling ]
            },
            {
                id: "falling",
                priority: 3,
                update: () => {
                    this.look();
                    this.move();
                },
                enterCondition: [ () => !this.physics.hasStartedFalling && !this.physics.isGrounded && !this.physics.hasStartedLanding ]
            },
            {
                id: "land",
                priority: 4,
                update: () => {
                    this.look();
                    this.move();
                },
                enterCondition: [ () => this.physics.hasStartedLanding ]
            }
        ];

        this.movementStateMachine = this.stateMachineController.createStateMachine("standard_movement", states);
    }

    protected move() {
        const input = this.standardInput;
        const canSprint = (input.sprint ?? false) && this.enableSprint;
        const speed = canSprint ? this.sprintSpeed : this.walkSpeed;
        this.physics.move(input.moveDeltaX ?? 0, input.moveDeltaY ?? 0, speed);
    }

    protected look() {
        const input = this.standardInput;

        const x = input.lookDeltaX ?? 0;
        const y = input.lookDeltaY ?? 0;
        this.camera.look(x, y);

        const scroll = input.scrollDeltaY ?? 0;
        this.camera.zoom(scroll);
    }

    protected jump() {
        this.physics.jump(this.jumpSpeed);
    }
}