import { RaidSimResult } from '/tbc/core/proto/api.js';
import { ActionId } from '/tbc/core/proto_utils/action_id.js';
export declare class Entity {
    readonly name: string;
    readonly ownerName: string;
    readonly index: number;
    readonly isTarget: boolean;
    readonly isPet: boolean;
    constructor(name: string, ownerName: string, index: number, isTarget: boolean, isPet: boolean);
    equals(other: Entity): boolean;
    toString(): string;
    static parseRegex: RegExp;
    static parseAll(str: string): Array<Entity>;
}
interface SimLogParams {
    raw: string;
    timestamp: number;
    source: Entity | null;
    target: Entity | null;
}
export declare class SimLog {
    readonly raw: string;
    readonly timestamp: number;
    readonly source: Entity | null;
    readonly target: Entity | null;
    activeAuras: Array<AuraUptimeLog>;
    constructor(params: SimLogParams);
    toString(): string;
    toStringPrefix(): string;
    static parseAll(result: RaidSimResult): Promise<Array<SimLog>>;
    isDamageDealt(): this is DamageDealtLog;
    isManaChanged(): this is ManaChangedLog;
    isAuraGained(): this is AuraGainedLog;
    isAuraFaded(): this is AuraFadedLog;
    isMajorCooldownUsed(): this is MajorCooldownUsedLog;
    isCastBegan(): this is CastBeganLog;
    isStatChange(): this is StatChangeLog;
    static groupDuplicateTimestamps<LogType extends SimLog>(logs: Array<LogType>): Array<Array<LogType>>;
}
export declare class DamageDealtLog extends SimLog {
    readonly amount: number;
    readonly miss: boolean;
    readonly hit: boolean;
    readonly crit: boolean;
    readonly tick: boolean;
    readonly partialResist1_4: boolean;
    readonly partialResist2_4: boolean;
    readonly partialResist3_4: boolean;
    readonly cause: ActionId;
    constructor(params: SimLogParams, amount: number, miss: boolean, crit: boolean, tick: boolean, partialResist1_4: boolean, partialResist2_4: boolean, partialResist3_4: boolean, cause: ActionId);
    resultString(): string;
    toString(): string;
    static parse(params: SimLogParams): Promise<DamageDealtLog> | null;
}
export declare class DpsLog extends SimLog {
    readonly dps: number;
    readonly damageLogs: Array<DamageDealtLog>;
    constructor(params: SimLogParams, dps: number, damageLogs: Array<DamageDealtLog>);
    static DPS_WINDOW: number;
    static fromLogs(damageDealtLogs: Array<DamageDealtLog>): Array<DpsLog>;
}
export declare class AuraGainedLog extends SimLog {
    readonly aura: ActionId;
    constructor(params: SimLogParams, aura: ActionId);
    toString(): string;
    static parse(params: SimLogParams): Promise<AuraGainedLog> | null;
}
export declare class AuraFadedLog extends SimLog {
    readonly aura: ActionId;
    constructor(params: SimLogParams, aura: ActionId);
    toString(): string;
    static parse(params: SimLogParams): Promise<AuraFadedLog> | null;
}
export declare class AuraUptimeLog extends SimLog {
    readonly gainedAt: number;
    readonly fadedAt: number;
    readonly aura: ActionId;
    constructor(params: SimLogParams, fadedAt: number, aura: ActionId);
    static fromLogs(logs: Array<SimLog>, entity: Entity): Array<AuraUptimeLog>;
    static populateActiveAuras(logs: Array<SimLog>, auraLogs: Array<AuraUptimeLog>): void;
}
export declare class ManaChangedLog extends SimLog {
    readonly manaBefore: number;
    readonly manaAfter: number;
    readonly isSpend: boolean;
    readonly cause: ActionId;
    constructor(params: SimLogParams, manaBefore: number, manaAfter: number, isSpend: boolean, cause: ActionId);
    toString(): string;
    resultString(): string;
    static parse(params: SimLogParams): Promise<ManaChangedLog> | null;
}
export declare class ManaChangedLogGroup extends SimLog {
    readonly manaBefore: number;
    readonly manaAfter: number;
    readonly logs: Array<ManaChangedLog>;
    constructor(params: SimLogParams, manaBefore: number, manaAfter: number, logs: Array<ManaChangedLog>);
    toString(): string;
    static fromLogs(logs: Array<SimLog>): Array<ManaChangedLogGroup>;
}
export declare class MajorCooldownUsedLog extends SimLog {
    readonly cooldownId: ActionId;
    constructor(params: SimLogParams, cooldownId: ActionId);
    toString(): string;
    static parse(params: SimLogParams): Promise<MajorCooldownUsedLog> | null;
}
export declare class CastBeganLog extends SimLog {
    readonly castId: ActionId;
    readonly currentMana: number;
    readonly manaCost: number;
    readonly castTime: number;
    constructor(params: SimLogParams, castId: ActionId, currentMana: number, manaCost: number, castTime: number);
    toString(): string;
    static parse(params: SimLogParams): Promise<CastBeganLog> | null;
}
export declare class StatChangeLog extends SimLog {
    readonly effectId: ActionId;
    readonly amount: number;
    readonly stat: string;
    constructor(params: SimLogParams, effectId: ActionId, amount: number, stat: string);
    toString(): string;
    static parse(params: SimLogParams): Promise<StatChangeLog> | null;
}
export {};