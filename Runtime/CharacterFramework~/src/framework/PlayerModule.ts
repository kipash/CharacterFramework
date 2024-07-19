import { Behaviour } from "@needle-tools/engine";
import { Player } from "./Player.js";

export enum PlayerModuleType {
    none = "none",

    physics = "physics",
    input = "input",
    camera = "camera",

    generic = "generic",
}

export enum PlayerModuleRole {
    local = 1 << 0,
    remote = 1 << 1,
    all = local | remote,
}

/** Modules solve singular areas of character logic */
export abstract class PlayerModule extends Behaviour {
    abstract get type(): PlayerModuleType;
    get allowedRoles() { return PlayerModuleRole.local; }

    protected player!: Player;
    protected get frameData() { return this.player.frameData; }
    protected get constantData() { return this.player.constantData; }

    protected _isInitialized: boolean = false;
    get isInitialized() { return this._isInitialized; }
    initialize(player: Player) {
        this.player = player;
        this._isInitialized = true;
    }

    get canUpdate() { 
        return this.isInitialized && 0 != (this.allowedRoles & (this.player.isLocalPlayer ? PlayerModuleRole.local : PlayerModuleRole.remote));
    }

    /** When this module was created on the fly and requires extra setup steps*/
    onDynamicallyConstructed?();

    updateInput?();

    /** update events */
    /* moduleEarlyUpdate() { }
    moduleUpdate() { }
    moduleLateUpdate() { }
    moduleOnBeforeRender() { } */
}
