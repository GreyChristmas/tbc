import { Spec } from '/tbc/core/proto/common.js';
import { Sim, SimConfig } from './sim.js';
import { TypedEvent } from './typed_event.js';
export declare type ReleaseStatus = 'Alpha' | 'Beta' | 'Live';
export interface SimUIConfig<SpecType extends Spec> extends SimConfig<SpecType> {
    releaseStatus: ReleaseStatus;
    knownIssues?: Array<string>;
}
export declare abstract class SimUI<SpecType extends Spec> {
    readonly parentElem: HTMLElement;
    readonly sim: Sim<SpecType>;
    readonly simUiConfig: SimUIConfig<SpecType>;
    private readonly exclusivityMap;
    constructor(parentElem: HTMLElement, config: SimUIConfig<SpecType>);
    init(): Promise<void>;
    registerExclusiveEffect(effect: ExclusiveEffect): void;
    getSavedGearStorageKey(): string;
    getSavedEncounterStorageKey(): string;
    getSavedRotationStorageKey(): string;
    getSavedSettingsStorageKey(): string;
    getSavedTalentsStorageKey(): string;
    private getStorageKey;
}
export declare type ExclusivityTag = 'Battle Elixir' | 'Drums' | 'Food' | 'Guardian Elixir' | 'Potion' | 'Rune' | 'Weapon Imbue';
export interface ExclusiveEffect {
    tags: Array<ExclusivityTag>;
    changedEvent: TypedEvent<any>;
    isActive: () => boolean;
    deactivate: () => void;
}
