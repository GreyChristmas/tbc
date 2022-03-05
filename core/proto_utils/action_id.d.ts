import { ActionID as ActionIdProto } from '/tbc/core/proto/common.js';
import { ResourceType } from '/tbc/core/proto/api.js';
import { Item } from '/tbc/core/proto/common.js';
import { OtherAction } from '/tbc/core/proto/common.js';
export declare class ActionId {
    readonly itemId: number;
    readonly spellId: number;
    readonly otherId: OtherAction;
    readonly tag: number;
    readonly baseName: string;
    readonly name: string;
    readonly iconUrl: string;
    private constructor();
    anyId(): number;
    equals(other: ActionId): boolean;
    equalsIgnoringTag(other: ActionId): boolean;
    setBackground(elem: HTMLElement): void;
    setWowheadHref(elem: HTMLAnchorElement): void;
    setBackgroundAndHref(elem: HTMLAnchorElement): void;
    fillAndSet(elem: HTMLAnchorElement, setHref: boolean, setBackground: boolean): Promise<ActionId>;
    fill(playerIndex?: number): Promise<ActionId>;
    toString(): string;
    toStringIgnoringTag(): string;
    toProto(): ActionIdProto;
    toProtoString(): string;
    withoutTag(): ActionId;
    static fromEmpty(): ActionId;
    static fromItemId(itemId: number, tag?: number): ActionId;
    static fromSpellId(spellId: number, tag?: number): ActionId;
    static fromOtherId(otherId: OtherAction, tag?: number): ActionId;
    static fromPetName(petName: string): ActionId;
    static fromItem(item: Item): ActionId;
    static fromProto(protoId: ActionIdProto): ActionId;
    static fromLogString(str: string): ActionId;
    private static getTooltipDataHelper;
    private static getTooltipData;
}
export declare const resourceTypeToIcon: Record<ResourceType, string>;
