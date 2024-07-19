import { getParam } from "@needle-tools/engine";
import { State } from "./State.js";

const debug = getParam("debugstatemachine");

export class FiniteStateMachine {
    readonly name: string;
    constructor(name: string) {
        this.name = name;
    }

    states: State[] = [];
    currentState?: State;

    protected calculateState(): State | undefined{
        const statesToEnter = this.states.filter(x => !x.enterCondition?.some(condition => !condition()))
                                         .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        return statesToEnter[0];
    }

    protected stateIdToSelect?: string;
    selectState(stateId: string) {
        this.stateIdToSelect = stateId;
    }
    protected _selectState(stateId: string) {
        const state = this.states[stateId];

        if (!state) return;

        this.currentState?.exit?.();
        this.currentState = state;

        state.enter?.();
    }

    update() {
        const newState = this.calculateState();
        if(newState) {
            if(this.currentState != newState) {
                this.currentState?.exit?.();
                newState.enter?.();
                if (debug) console.log(`${this.name}: ${this.currentState?.id ?? "none"} -> ${newState.id ?? "?"}`);
            }
            this.currentState = newState;
        }

        this.currentState?.update?.();
    
        // select a desired state at the end of the frame
        if (this.stateIdToSelect) {
            this._selectState(this.stateIdToSelect);
            this.stateIdToSelect = undefined;
        }
    }

    addState(state: State) {
        this.states.push(state);
    }

    adjustState(stateName: string, handler: (state:State) => void) {
        const state = this.states.find(x => x.id === stateName);
        if (state) handler(state);
        else if (debug) console.warn(`Can't adjust state '${stateName}'`);
    }
}

export class FSMController {
    protected machines: Map<string, FiniteStateMachine> = new Map<string, FiniteStateMachine>();

    createStateMachine(name: string, states: State[]): FiniteStateMachine {
        const fsm = new FiniteStateMachine(name);
        fsm.states = states;
        this.machines.set(name, fsm);
        return fsm;
    }

    getStateMachine(name: string): FiniteStateMachine | undefined {
        return this.machines.get(name);
    }
    
    update() {
        this.machines.forEach(layer => layer.update());
    }
}