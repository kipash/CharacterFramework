import { MathUtils } from "three";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { CharacterPhysics_Scheme } from "../physics/CharacterPhysics.js";
import { AudioSource, serializable } from "@needle-tools/engine";

declare type AudioClip = string;

/** Module that plays movement audio based on the character speed and the grounded state */
export class CommonCharacterAudio extends PlayerModule {
    @serializable()
    stepDistance: number = 1;

    @serializable()
    landThreshold: number = 0.2;

    @serializable(URL)
    footStepSFX: AudioClip[] = [];

    @serializable(URL)
    landSFX?: AudioClip[] = [];

    @serializable(URL)
    jumpSFX?: AudioClip[] = [];

    @serializable()
    adjustWithScale: boolean = true;

    get type() { return PlayerModuleType.generic; }

    private lastFootStep: number = 0;

    private footstepSource: AudioSource | null = null;
    private otherSource: AudioSource | null = null;

    start(): void {
        this.footstepSource = this.gameObject.addNewComponent(AudioSource);
        this.otherSource = this.gameObject.addNewComponent(AudioSource);
    }

    private airtime: number = 0;
    private groundedLastFrame: boolean | null = null;
    private distance = 0;
    onBeforeRender(): void {
        if (!this.canUpdate) return;
        if (!this.footstepSource) return;

        const physicsState = this.constantData as CharacterPhysics_Scheme;
        const time = this.context.time;

        // get world scale
        const wScale = this.player.gameObject.worldScale;
        const scale = Math.min(wScale.x, wScale.y, wScale.z);

        if (physicsState.characterSpeed != null && physicsState.characterSpeed > 0.1) {
            this.distance += physicsState.characterSpeed * time.deltaTime / scale;
            if (this.distance > this.stepDistance) {
                this.distance = 0;
                if (physicsState.characterIsGrounded === true) {
                    this.footstepSource.stop();
                    this.footstepSource.play(this.getRandomClip(this.footStepSFX));
                }
            }
        }

        if (physicsState.characterIsJumping && this.otherSource) {
            this.otherSource.stop();
            this.otherSource.play(this.getRandomClip(this.jumpSFX));
        }

        // land
        const hasLand = physicsState.characterIsGrounded === true && this.groundedLastFrame === false;
        if (hasLand && this.airtime > this.landThreshold  && this.otherSource) {
            this.otherSource.stop();
            this.otherSource.play(this.getRandomClip(this.landSFX));
        }

        // reset land
        if(physicsState.characterIsGrounded === false)
            this.airtime += time.deltaTime;
        else
            this.airtime = 0;

        this.groundedLastFrame = physicsState.characterIsGrounded!;
    }

    protected getRandomClip(clips?: AudioClip[]): AudioClip | undefined {
        if(!clips || clips.length <= 0) 
            return undefined;
        else
            return clips[MathUtils.randInt(0, clips.length - 1)];
    }
}