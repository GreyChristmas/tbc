import { Debuffs } from '/tbc/core/proto/common.js';
import { MobType } from '/tbc/core/proto/common.js';
import { SpellSchool } from '/tbc/core/proto/common.js';
import { Target as TargetProto } from '/tbc/core/proto/common.js';
import { Stats } from '/tbc/core/proto_utils/stats.js';
import { Sim } from './sim.js';
import { EventID, TypedEvent } from './typed_event.js';
export declare class Target {
    readonly sim: Sim;
    private level;
    private mobType;
    private tankIndex;
    private stats;
    private swingSpeed;
    private minBaseDamage;
    private dualWield;
    private canCrush;
    private parryHaste;
    private spellSchool;
    private debuffs;
    readonly levelChangeEmitter: TypedEvent<void>;
    readonly mobTypeChangeEmitter: TypedEvent<void>;
    readonly propChangeEmitter: TypedEvent<void>;
    readonly statsChangeEmitter: TypedEvent<void>;
    readonly debuffsChangeEmitter: TypedEvent<void>;
    readonly changeEmitter: TypedEvent<void>;
    constructor(sim: Sim);
    getLevel(): number;
    setLevel(eventID: EventID, newLevel: number): void;
    getMobType(): MobType;
    setMobType(eventID: EventID, newMobType: MobType): void;
    getTankIndex(): number;
    setTankIndex(eventID: EventID, newTankIndex: number): void;
    getSwingSpeed(): number;
    setSwingSpeed(eventID: EventID, newSwingSpeed: number): void;
    getMinBaseDamage(): number;
    setMinBaseDamage(eventID: EventID, newMinBaseDamage: number): void;
    getDualWield(): boolean;
    setDualWield(eventID: EventID, newDualWield: boolean): void;
    getCanCrush(): boolean;
    setCanCrush(eventID: EventID, newCanCrush: boolean): void;
    getParryHaste(): boolean;
    setParryHaste(eventID: EventID, newParryHaste: boolean): void;
    getSpellSchool(): SpellSchool;
    setSpellSchool(eventID: EventID, newSpellSchool: SpellSchool): void;
    getStats(): Stats;
    setStats(eventID: EventID, newStats: Stats): void;
    getDebuffs(): Debuffs;
    setDebuffs(eventID: EventID, newDebuffs: Debuffs): void;
    toProto(): TargetProto;
    fromProto(eventID: EventID, proto: TargetProto): void;
    static defaultProto(): TargetProto;
    static fromDefaults(eventID: EventID, sim: Sim): Target;
}
