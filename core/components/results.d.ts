import { IndividualSimRequest, IndividualSimResult } from '/tbc/core/proto/api.js';
import { StatWeightsRequest, StatWeightsResult } from '/tbc/core/proto/api.js';
import { Stat } from '/tbc/core/proto/common.js';
import { Sim } from '/tbc/core/sim.js';
import { Component } from './component.js';
export declare class Results extends Component {
    private readonly sim;
    private readonly pendingElem;
    private readonly simElem;
    private readonly simDpsElem;
    private readonly epElem;
    private readonly simReferenceElem;
    private readonly simReferenceDiffElem;
    private statsType;
    private currentData;
    private referenceData;
    constructor(parent: HTMLElement, sim: Sim<any>);
    hideAll(): void;
    setPending(): void;
    setSimResult(request: IndividualSimRequest, result: IndividualSimResult): void;
    setStatWeights(request: StatWeightsRequest, result: StatWeightsResult, epStats: Array<Stat>): void;
    updateReference(): void;
}