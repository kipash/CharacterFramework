import { Animator, AnimatorController, serializable } from "@needle-tools/engine";
import { PlayerModule, PlayerModuleType } from "../../framework/PlayerModule.js";
import { State } from "../../framework/State.js";
import { CharacterPhysics_Scheme } from "../physics/CharacterPhysics.js";

class StateAnimation_SpeedMultiplier {
    @serializable()
    stateName: string = "";

    @serializable()
    speedReference: number = 1;
}

export class StateAnimation extends PlayerModule {
    get type(): PlayerModuleType { return PlayerModuleType.generic; }

    @serializable(Animator)
    animator?: Animator;

    @serializable()
    trasnitionDuration: number = 0.15;

    @serializable(StateAnimation_SpeedMultiplier)
    speedReferences: StateAnimation_SpeedMultiplier[] = [];
    
    private _speedRefMap?: Map<string, number>;

    @serializable()
    layerName: string = "";

    @serializable()
    speedMultiplierName: string = "speedMultiplier";

    private controller: AnimatorController | null = null;
    awake(): void {
        if (!this.animator) return;

        this.controller = this.animator.runtimeAnimatorController!;
        this._speedRefMap = new Map<string, number>(this.speedReferences.map(x => [x.stateName, x.speedReference]));
    }

    private previousState?: State;
    update() {
        if (!this.animator || !this.controller) return;

        const stateMachine = this.player.stateMachineController.getStateMachine(this.layerName);
        const curretState = stateMachine?.currentState;
        
        if(this.previousState !== curretState && curretState) {
            const animName = this.findAnimName(this.animator, curretState?.id);
            if (animName) {
                //calling animator API instead of controller API to mark the animator as dirty
                this.animator.play(animName, undefined, undefined, this.trasnitionDuration); 
            }
        }

        const physicsData = this.player.constantData as CharacterPhysics_Scheme;
        const speed = physicsData.characterSpeed ?? 0;
        const speedDivider = this._speedRefMap?.get(curretState?.id ?? "") ?? 1;
        if (this.speedMultiplierName != "" && speedDivider != 0) {
            this.animator.setFloat(this.speedMultiplierName, speed / speedDivider);
        }

        this.previousState = curretState;
    }

    private findAnimName(animator: Animator, id: string): string | null {
        if (!id) return null;
        const controller = animator.runtimeAnimatorController;
        const layers = controller?.model.layers;
        if (Array.isArray(layers)) {
            for (const layer of layers) {
                for (const state of layer.stateMachine.states) {
                    if(state.name.toLowerCase() == state.name.toLowerCase()) {
                        return state.name;
                    }
                }
            }
        }
        return null;
    }
}