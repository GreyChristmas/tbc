import { ActionMetrics as ActionMetricsProto } from '/tbc/core/proto/api.js';
import { AuraMetrics as AuraMetricsProto } from '/tbc/core/proto/api.js';
import { DistributionMetrics as DistributionMetricsProto } from '/tbc/core/proto/api.js';
import { Encounter as EncounterProto } from '/tbc/core/proto/common.js';
import { EncounterMetrics as EncounterMetricsProto } from '/tbc/core/proto/api.js';
import { Party as PartyProto } from '/tbc/core/proto/api.js';
import { PartyMetrics as PartyMetricsProto } from '/tbc/core/proto/api.js';
import { Player as PlayerProto } from '/tbc/core/proto/api.js';
import { UnitMetrics as UnitMetricsProto } from '/tbc/core/proto/api.js';
import { Raid as RaidProto } from '/tbc/core/proto/api.js';
import { RaidMetrics as RaidMetricsProto } from '/tbc/core/proto/api.js';
import { ResourceMetrics as ResourceMetricsProto, ResourceType } from '/tbc/core/proto/api.js';
import { Target as TargetProto } from '/tbc/core/proto/common.js';
import { TargetedActionMetrics as TargetedActionMetricsProto } from '/tbc/core/proto/api.js';
import { RaidSimRequest, RaidSimResult } from '/tbc/core/proto/api.js';
import { Spec } from '/tbc/core/proto/common.js';
import { SimRun } from '/tbc/core/proto/ui.js';
import { ActionId } from '/tbc/core/proto_utils/action_id.js';
import { AuraUptimeLog, CastLog, DamageDealtLog, DpsLog, MajorCooldownUsedLog, ResourceChangedLogGroup, SimLog, ThreatLogGroup } from './logs_parser.js';
export interface SimResultFilter {
    player?: number | null;
    target?: number | null;
}
declare class SimResultData {
    readonly request: RaidSimRequest;
    readonly result: RaidSimResult;
    constructor(request: RaidSimRequest, result: RaidSimResult);
    get iterations(): number;
    get duration(): number;
    get firstIterationDuration(): number;
}
export declare class SimResult {
    readonly request: RaidSimRequest;
    readonly result: RaidSimResult;
    readonly raidMetrics: RaidMetrics;
    readonly encounterMetrics: EncounterMetrics;
    readonly logs: Array<SimLog>;
    private constructor();
    getPlayers(filter?: SimResultFilter): Array<UnitMetrics>;
    getFirstPlayer(): UnitMetrics | null;
    getPlayerWithRaidIndex(raidIndex: number): UnitMetrics | null;
    getTargets(filter?: SimResultFilter): Array<UnitMetrics>;
    getTargetWithIndex(index: number): UnitMetrics | null;
    getDamageMetrics(filter: SimResultFilter): DistributionMetricsProto;
    getActionMetrics(filter: SimResultFilter): Array<ActionMetrics>;
    getSpellMetrics(filter: SimResultFilter): Array<ActionMetrics>;
    getMeleeMetrics(filter: SimResultFilter): Array<ActionMetrics>;
    getResourceMetrics(filter: SimResultFilter, resourceType: ResourceType): Array<ResourceMetrics>;
    getBuffMetrics(filter: SimResultFilter): Array<AuraMetrics>;
    getDebuffMetrics(filter: SimResultFilter): Array<AuraMetrics>;
    toProto(): SimRun;
    static fromProto(proto: SimRun): Promise<SimResult>;
    static makeNew(request: RaidSimRequest, result: RaidSimResult): Promise<SimResult>;
}
export declare class RaidMetrics {
    private readonly raid;
    private readonly metrics;
    readonly dps: DistributionMetricsProto;
    readonly parties: Array<PartyMetrics>;
    private constructor();
    static makeNew(resultData: SimResultData, raid: RaidProto, metrics: RaidMetricsProto, logs: Array<SimLog>): Promise<RaidMetrics>;
}
export declare class PartyMetrics {
    private readonly party;
    private readonly metrics;
    readonly partyIndex: number;
    readonly dps: DistributionMetricsProto;
    readonly players: Array<UnitMetrics>;
    private constructor();
    static makeNew(resultData: SimResultData, party: PartyProto, metrics: PartyMetricsProto, partyIndex: number, logs: Array<SimLog>): Promise<PartyMetrics>;
}
export declare class UnitMetrics {
    private readonly player;
    private readonly target;
    private readonly metrics;
    readonly index: number;
    readonly name: string;
    readonly spec: Spec;
    readonly petActionId: ActionId | null;
    readonly iconUrl: string;
    readonly classColor: string;
    readonly dps: DistributionMetricsProto;
    readonly tps: DistributionMetricsProto;
    readonly dtps: DistributionMetricsProto;
    readonly actions: Array<ActionMetrics>;
    readonly auras: Array<AuraMetrics>;
    readonly resources: Array<ResourceMetrics>;
    readonly pets: Array<UnitMetrics>;
    private readonly iterations;
    private readonly duration;
    readonly logs: Array<SimLog>;
    readonly damageDealtLogs: Array<DamageDealtLog>;
    readonly groupedResourceLogs: Record<ResourceType, Array<ResourceChangedLogGroup>>;
    readonly dpsLogs: Array<DpsLog>;
    readonly auraUptimeLogs: Array<AuraUptimeLog>;
    readonly majorCooldownLogs: Array<MajorCooldownUsedLog>;
    readonly castLogs: Array<CastLog>;
    readonly threatLogs: Array<ThreatLogGroup>;
    readonly majorCooldownAuraUptimeLogs: Array<AuraUptimeLog>;
    private constructor();
    get label(): string;
    get isPet(): boolean;
    get inFrontOfTarget(): boolean;
    get maxThreat(): number;
    get secondsOomAvg(): number;
    get totalDamage(): number;
    getPlayerAndPetActions(): Array<ActionMetrics>;
    getMeleeActions(): Array<ActionMetrics>;
    getSpellActions(): Array<ActionMetrics>;
    getResourceMetrics(resourceType: ResourceType): Array<ResourceMetrics>;
    static makeNewPlayer(resultData: SimResultData, player: PlayerProto, metrics: UnitMetricsProto, raidIndex: number, isPet: boolean, logs: Array<SimLog>): Promise<UnitMetrics>;
    static makeNewTarget(resultData: SimResultData, target: TargetProto, metrics: UnitMetricsProto, index: number, logs: Array<SimLog>): Promise<UnitMetrics>;
}
export declare class EncounterMetrics {
    private readonly encounter;
    private readonly metrics;
    readonly targets: Array<UnitMetrics>;
    private constructor();
    static makeNew(resultData: SimResultData, encounter: EncounterProto, metrics: EncounterMetricsProto, logs: Array<SimLog>): Promise<EncounterMetrics>;
    get durationSeconds(): number;
}
export declare class AuraMetrics {
    unit: UnitMetrics | null;
    readonly actionId: ActionId;
    readonly name: string;
    readonly iconUrl: string;
    private readonly resultData;
    private readonly iterations;
    private readonly duration;
    private readonly data;
    private constructor();
    get uptimePercent(): number;
    static makeNew(unit: UnitMetrics | null, resultData: SimResultData, auraMetrics: AuraMetricsProto, playerIndex?: number): Promise<AuraMetrics>;
    static merge(auras: Array<AuraMetrics>, removeTag?: boolean, actionIdOverride?: ActionId): AuraMetrics;
    static groupById(auras: Array<AuraMetrics>, useTag?: boolean): Array<Array<AuraMetrics>>;
    static joinById(auras: Array<AuraMetrics>, useTag?: boolean): Array<AuraMetrics>;
}
export declare class ResourceMetrics {
    unit: UnitMetrics | null;
    readonly actionId: ActionId;
    readonly name: string;
    readonly iconUrl: string;
    readonly type: ResourceType;
    private readonly resultData;
    private readonly iterations;
    private readonly duration;
    private readonly data;
    private constructor();
    get events(): number;
    get gain(): number;
    get gainPerSecond(): number;
    get avgGain(): number;
    get wastedGain(): number;
    static makeNew(unit: UnitMetrics | null, resultData: SimResultData, resourceMetrics: ResourceMetricsProto, playerIndex?: number): Promise<ResourceMetrics>;
    static merge(resources: Array<ResourceMetrics>, removeTag?: boolean, actionIdOverride?: ActionId): ResourceMetrics;
    static groupById(resources: Array<ResourceMetrics>, useTag?: boolean): Array<Array<ResourceMetrics>>;
    static joinById(resources: Array<ResourceMetrics>, useTag?: boolean): Array<ResourceMetrics>;
}
export declare class ActionMetrics {
    unit: UnitMetrics | null;
    readonly actionId: ActionId;
    readonly name: string;
    readonly iconUrl: string;
    readonly targets: Array<TargetedActionMetrics>;
    private readonly resultData;
    private readonly iterations;
    private readonly duration;
    private readonly data;
    private readonly combinedMetrics;
    private constructor();
    get isMeleeAction(): boolean;
    get damage(): number;
    get dps(): number;
    get tps(): number;
    get casts(): number;
    get castsPerMinute(): number;
    get avgCast(): number;
    get avgCastThreat(): number;
    get landedHits(): number;
    get hitAttempts(): number;
    get avgHit(): number;
    get avgHitThreat(): number;
    get critPercent(): number;
    get crushPercent(): number;
    get misses(): number;
    get missPercent(): number;
    get dodges(): number;
    get dodgePercent(): number;
    get parries(): number;
    get parryPercent(): number;
    get blocks(): number;
    get blockPercent(): number;
    get glances(): number;
    get glancePercent(): number;
    forTarget(index: number): ActionMetrics;
    static makeNew(unit: UnitMetrics | null, resultData: SimResultData, actionMetrics: ActionMetricsProto, playerIndex?: number): Promise<ActionMetrics>;
    static merge(actions: Array<ActionMetrics>, removeTag?: boolean, actionIdOverride?: ActionId): ActionMetrics;
    static groupById(actions: Array<ActionMetrics>, useTag?: boolean): Array<Array<ActionMetrics>>;
    static joinById(actions: Array<ActionMetrics>, useTag?: boolean): Array<ActionMetrics>;
}
export declare class TargetedActionMetrics {
    private readonly iterations;
    private readonly duration;
    readonly data: TargetedActionMetricsProto;
    constructor(iterations: number, duration: number, data: TargetedActionMetricsProto);
    get damage(): number;
    get dps(): number;
    get tps(): number;
    get casts(): number;
    get castsPerMinute(): number;
    get avgCast(): number;
    get avgCastThreat(): number;
    private get landedHitsRaw();
    get landedHits(): number;
    get hitAttempts(): number;
    get avgHit(): number;
    get avgHitThreat(): number;
    get critPercent(): number;
    get crushPercent(): number;
    get misses(): number;
    get missPercent(): number;
    get dodges(): number;
    get dodgePercent(): number;
    get parries(): number;
    get parryPercent(): number;
    get blocks(): number;
    get blockPercent(): number;
    get glances(): number;
    get glancePercent(): number;
    static merge(actions: Array<TargetedActionMetrics>): TargetedActionMetrics;
}
export {};
