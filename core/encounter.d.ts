import { Encounter as EncounterProto } from '/tbc/core/proto/common.js';
import { EncounterType } from '/tbc/core/proto/common.js';
import { Target } from '/tbc/core/target.js';
import { Sim } from './sim.js';
import { EventID, TypedEvent } from './typed_event.js';
export declare class Encounter {
    readonly sim: Sim;
    private type;
    private duration;
    private durationVariation;
    private numTargets;
    private executeProportion;
    private targets;
    readonly targetsChangeEmitter: TypedEvent<void>;
    readonly typeChangeEmitter: TypedEvent<void>;
    readonly durationChangeEmitter: TypedEvent<void>;
    readonly numTargetsChangeEmitter: TypedEvent<void>;
    readonly executeProportionChangeEmitter: TypedEvent<void>;
    readonly changeEmitter: TypedEvent<void>;
    constructor(sim: Sim);
    get primaryTarget(): Target;
    getType(): EncounterType;
    setType(eventID: EventID, newType: EncounterType): void;
    getDurationVariation(): number;
    setDurationVariation(eventID: EventID, newDuration: number): void;
    getDuration(): number;
    setDuration(eventID: EventID, newDuration: number): void;
    getExecuteProportion(): number;
    setExecuteProportion(eventID: EventID, newExecuteProportion: number): void;
    getNumTargets(): number;
    setNumTargets(eventID: EventID, newNumTargets: number): void;
    getTargets(): Array<Target>;
    setTargets(eventID: EventID, newTargets: Array<Target>): void;
    toProto(): EncounterProto;
    fromProto(eventID: EventID, proto: EncounterProto): void;
    applyDefaults(eventID: EventID): void;
}
