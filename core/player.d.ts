import { Class } from '/tbc/core/proto/common.js';
import { Consumes } from '/tbc/core/proto/common.js';
import { Enchant } from '/tbc/core/proto/common.js';
import { Gem } from '/tbc/core/proto/common.js';
import { GemColor } from '/tbc/core/proto/common.js';
import { IndividualBuffs } from '/tbc/core/proto/common.js';
import { ItemSlot } from '/tbc/core/proto/common.js';
import { Item } from '/tbc/core/proto/common.js';
import { Race } from '/tbc/core/proto/common.js';
import { Spec } from '/tbc/core/proto/common.js';
import { Stat } from '/tbc/core/proto/common.js';
import { PlayerStats } from '/tbc/core/proto/api.js';
import { Player as PlayerProto } from '/tbc/core/proto/api.js';
import { StatWeightsResult } from '/tbc/core/proto/api.js';
import { EquippedItem } from '/tbc/core/proto_utils/equipped_item.js';
import { Gear } from '/tbc/core/proto_utils/gear.js';
import { Stats } from '/tbc/core/proto_utils/stats.js';
import { Faction, SpecRotation, SpecTalents, SpecTypeFunctions, SpecOptions } from '/tbc/core/proto_utils/utils.js';
import { EventID, TypedEvent } from './typed_event.js';
import { Party } from './party.js';
import { Raid } from './raid.js';
import { Sim } from './sim.js';
export declare class Player<SpecType extends Spec> {
    readonly sim: Sim;
    private party;
    private raid;
    readonly spec: Spec;
    private name;
    private buffs;
    private consumes;
    private bonusStats;
    private gear;
    private race;
    private rotation;
    private talents;
    private talentsString;
    private specOptions;
    readonly specTypeFunctions: SpecTypeFunctions<SpecType>;
    private epWeights;
    private currentStats;
    readonly nameChangeEmitter: TypedEvent<void>;
    readonly buffsChangeEmitter: TypedEvent<void>;
    readonly consumesChangeEmitter: TypedEvent<void>;
    readonly bonusStatsChangeEmitter: TypedEvent<void>;
    readonly gearChangeEmitter: TypedEvent<void>;
    readonly raceChangeEmitter: TypedEvent<void>;
    readonly rotationChangeEmitter: TypedEvent<void>;
    readonly talentsChangeEmitter: TypedEvent<void>;
    readonly talentsStringChangeEmitter: TypedEvent<void>;
    readonly specOptionsChangeEmitter: TypedEvent<void>;
    readonly currentStatsEmitter: TypedEvent<void>;
    readonly changeEmitter: TypedEvent<void>;
    constructor(spec: Spec, sim: Sim);
    getSpecIcon(): string;
    getClass(): Class;
    getClassColor(): string;
    getParty(): Party | null;
    getRaid(): Raid | null;
    getPartyIndex(): number;
    getRaidIndex(): number;
    setParty(newParty: Party | null): void;
    getOtherPartyMembers(): Array<Player<any>>;
    getItems(slot: ItemSlot | undefined): Array<Item>;
    getEnchants(slot: ItemSlot | undefined): Array<Enchant>;
    getGems(socketColor: GemColor | undefined): Array<Gem>;
    getEpWeights(): Stats;
    setEpWeights(newEpWeights: Stats): void;
    computeStatWeights(epStats: Array<Stat>, epReferenceStat: Stat): Promise<StatWeightsResult>;
    getCurrentStats(): PlayerStats;
    setCurrentStats(eventID: EventID, newStats: PlayerStats): void;
    getName(): string;
    setName(eventID: EventID, newName: string): void;
    getLabel(): string;
    getRace(): Race;
    setRace(eventID: EventID, newRace: Race): void;
    getFaction(): Faction;
    getBuffs(): IndividualBuffs;
    setBuffs(eventID: EventID, newBuffs: IndividualBuffs): void;
    getConsumes(): Consumes;
    setConsumes(eventID: EventID, newConsumes: Consumes): void;
    equipItem(eventID: EventID, slot: ItemSlot, newItem: EquippedItem | null): void;
    getEquippedItem(slot: ItemSlot): EquippedItem | null;
    getGear(): Gear;
    setGear(eventID: EventID, newGear: Gear): void;
    getBonusStats(): Stats;
    setBonusStats(eventID: EventID, newBonusStats: Stats): void;
    getRotation(): SpecRotation<SpecType>;
    setRotation(eventID: EventID, newRotation: SpecRotation<SpecType>): void;
    getTalents(): SpecTalents<SpecType>;
    setTalents(eventID: EventID, newTalents: SpecTalents<SpecType>): void;
    getTalentsString(): string;
    setTalentsString(eventID: EventID, newTalentsString: string): void;
    getTalentTreeIcon(): string;
    getSpecOptions(): SpecOptions<SpecType>;
    setSpecOptions(eventID: EventID, newSpecOptions: SpecOptions<SpecType>): void;
    computeGemEP(gem: Gem): number;
    computeEnchantEP(enchant: Enchant): number;
    computeItemEP(item: Item): number;
    setWowheadData(equippedItem: EquippedItem, elem: HTMLElement): void;
    toProto(): PlayerProto;
    fromProto(eventID: EventID, proto: PlayerProto): void;
    toJson(): Object;
    fromJson(eventID: EventID, obj: any): void;
    clone(eventID: EventID): Player<SpecType>;
}
