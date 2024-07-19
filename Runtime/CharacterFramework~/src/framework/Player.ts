import { Behaviour, ConstructorConcrete, EventList, PlayerState } from "@needle-tools/engine";
import { FSMController } from "./FiniteStateMachine.js";
import { PlayerData } from "./PlayerData.js";
import { PlayerModule, PlayerModuleRole, PlayerModuleType } from "./PlayerModule.js";

/** Base definition of an Player which has modules that define its capabilities. 
 *  These modules communciate via a state object that holds values */
export abstract class Player extends Behaviour {
    /** Modules that define the character's input, view and motor */
    protected modules!: Set<PlayerModule>;

    /** shared object that modules read from and write into to expose API
        frame state in oppose to state is delated on the beginning of every frame */
    private _frameData!: PlayerData;
    get frameData(): PlayerData { return this._frameData; }

    private _constantData!: PlayerData;
    get constantData(): PlayerData { return this._constantData; }

    private _isInitialized: boolean = false;
    get isInitialized() { return this._isInitialized; }

    stateMachineController!: FSMController;

    //@nonSerialized
    onRoleChanged!: EventList;

    playerState?: PlayerState | null = null;
    get isLocalPlayer(): boolean { return this.playerState?.isLocalPlayer ?? true; }
    get isNetworking(): boolean { return this.context.connection.isInRoom; }

    /** Waits for owner, otherwise initializes right away */
    protected startInitialization(findModules: boolean = true) {
        if (this.isNetworking && this.playerState && !this.playerState.owner) {
            this.playerState.onFirstOwnerChangeEvent.addEventListener(() => {
                this.initialize(findModules);
            });
        }
        else {
            this.initialize(findModules);
        }
    }

    /** Initialize the character and modules. */
    protected initialize(findModules: boolean = true) {
        if (findModules) {
            this.addAllModules();
        }

        this.modules.forEach(module => {
            if (!module.isInitialized)
                module.initialize(this);
        });
        this._isInitialized = true;

        this.roleChanged(this.isLocalPlayer);

        // Force character objects to ignore raycast
        this.gameObject.layers.set(2);
        this.gameObject.traverse(x => x.layers.set(2));
    }

    protected roleChanged(isLocalPlayer: boolean) {
        this.onRoleChanged?.invoke(isLocalPlayer);
    }

    addAllModules() {
        this.gameObject.getComponentsInChildren(PlayerModule).forEach(x => this.addModule(x));
    }

    ensureModule<TModule extends PlayerModule>(type: ConstructorConcrete<TModule>, onModuleCreated?: (instance: TModule) => void): TModule {
        let module = this.gameObject.getComponentInChildren<TModule>(type);
        if (!module) {
            module = this.gameObject.addNewComponent(type)!;
            module.sourceId ||= this.sourceId;
            module.onDynamicallyConstructed?.();
            onModuleCreated?.(module);
        }
        return module;
    }

    hasModule<Base extends PlayerModule>(type: ConstructorConcrete<Base>): boolean {
        return this.gameObject.getComponentInChildren(type) != null;
    }

    addModule(module: PlayerModule) {
        this.modules.add(module);
    }

    removeModule(module: PlayerModule) {
        this.modules.delete(module);
    }

    allegableForUpdate(module: PlayerModule): boolean {
        return module.isInitialized && 0 != (module.allowedRoles & (this.isLocalPlayer ? PlayerModuleRole.local : PlayerModuleRole.remote));
    }

    // --- Object API ---

    awake() {
        this.modules = new Set();
        this.stateMachineController = new FSMController();
        this._constantData = {};
        this._frameData = {};
        this.onRoleChanged = new EventList();
        this.playerState = this.gameObject.getComponent(PlayerState)!;
    }

    start() {
        this.startInitialization(true);
    }

    earlyUpdate(): void {
        // clear frame state
        this._frameData = {};

        // call updateInput method on input modules
        this.modules.forEach(module => {
            if (module.canUpdate && module.type == PlayerModuleType.input) {
                const m = module as any;
                if(m && typeof m.updateInput === "function") {
                    m.updateInput();
                }
            }
        });
    }

    update(): void {
        // update state machine and states
        this.stateMachineController.update();
    }
}