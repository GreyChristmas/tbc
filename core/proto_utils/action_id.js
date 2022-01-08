import { ActionID as ActionIdProto } from '/tbc/core/proto/common.js';
import { OtherAction } from '/tbc/core/proto/common.js';
import { getWowheadItemId } from '/tbc/core/proto_utils/equipped_item.js';
import { NO_TARGET } from '/tbc/core/proto_utils/utils.js';
// Uniquely identifies a specific item / spell / thing in WoW. This object is immutable.
export class ActionId {
    constructor(itemId, spellId, otherId, tag, name, iconUrl) {
        this.itemId = itemId;
        this.spellId = spellId;
        this.otherId = otherId;
        this.tag = tag;
        switch (otherId) {
            case OtherAction.OtherActionNone:
                break;
            case OtherAction.OtherActionWait:
                name = 'Wait';
                break;
            case OtherAction.OtherActionManaRegen:
                name = 'Regen';
                // Tag is number of milliseconds worth of regen.
                if (tag) {
                    name = (tag / 1000).toFixed(3) + 's ' + name;
                }
                break;
        }
        this.name = name;
        this.iconUrl = iconUrl;
    }
    equals(other) {
        return this.equalsIgnoringTag(other) && this.tag == other.tag;
    }
    equalsIgnoringTag(other) {
        return (this.itemId == other.itemId
            && this.spellId == other.spellId
            && this.otherId == other.otherId);
    }
    setBackground(elem) {
        if (this.iconUrl) {
            elem.style.backgroundImage = `url('${this.iconUrl}')`;
        }
    }
    setWowheadHref(elem) {
        if (this.itemId) {
            elem.href = 'https://tbc.wowhead.com/item=' + this.itemId;
        }
        else if (this.spellId) {
            elem.href = 'https://tbc.wowhead.com/spell=' + this.spellId;
        }
    }
    setBackgroundAndHref(elem) {
        this.setBackground(elem);
        this.setWowheadHref(elem);
    }
    async fillAndSet(elem, setHref, setBackground) {
        const filled = await this.fill();
        if (setHref) {
            filled.setWowheadHref(elem);
        }
        if (setBackground) {
            filled.setBackground(elem);
        }
        return filled;
    }
    static async getTooltipDataHelper(id, tooltipPostfix, cache) {
        if (!cache.has(id)) {
            cache.set(id, fetch(`https://tbc.wowhead.com/tooltip/${tooltipPostfix}/${id}`)
                .then(response => response.json()));
        }
        return cache.get(id);
    }
    async getTooltipData() {
        const idString = this.toProtoString();
        const idToLookup = idOverrides[idString] ? idOverrides[idString] : this;
        if (idToLookup.itemId) {
            return await ActionId.getTooltipDataHelper(idToLookup.itemId, 'item', itemToTooltipDataCache);
        }
        else {
            return await ActionId.getTooltipDataHelper(idToLookup.spellId, 'spell', spellToTooltipDataCache);
        }
    }
    // Returns an ActionId with the name and iconUrl fields filled.
    // playerIndex is the optional index of the player to whom this ID corresponds.
    async fill(playerIndex) {
        if (this.name || this.iconUrl) {
            return this;
        }
        if (this.otherId) {
            return this;
        }
        const tooltipData = await this.getTooltipData();
        const iconUrl = "https://wow.zamimg.com/images/wow/icons/large/" + tooltipData['icon'] + ".jpg";
        let name = tooltipData['name'];
        switch (name) {
            case 'Fireball':
            case 'Pyroblast':
                if (this.tag)
                    name += ' (DoT)';
                break;
            case 'Mind Flay':
                if (this.tag == 1) {
                    name += ' (1 Tick)';
                }
                else if (this.tag == 2) {
                    name += ' (2 Tick)';
                }
                else if (this.tag == 3) {
                    name += ' (3 Tick)';
                }
                break;
            case 'Lightning Bolt':
                if (this.tag)
                    name += ' (LO)';
                break;
            // For targetted buffs, tag is the source player's raid index or -1 if none.
            case 'Bloodlust':
            case 'Innervate':
            case 'Mana Tide Totem':
            case 'Power Infusion':
                if (this.tag != NO_TARGET) {
                    if (this.tag === playerIndex) {
                        name += ` (self)`;
                    }
                    else {
                        name += ` (from #${this.tag + 1})`;
                    }
                }
                break;
            default:
                if (this.tag == 10) {
                    name += ' (Auto)';
                }
                else if (this.tag == 11) {
                    name += ' (Offhand Auto)';
                }
                else if (this.tag) {
                    name += ' (??)';
                }
                break;
        }
        return new ActionId(this.itemId, this.spellId, this.otherId, this.tag, name, iconUrl);
    }
    toString() {
        let tagStr = this.tag ? ('-' + this.tag) : '';
        if (this.itemId) {
            return 'item-' + this.itemId + tagStr;
        }
        else if (this.spellId) {
            return 'spell-' + this.spellId + tagStr;
        }
        else if (this.otherId) {
            return 'other-' + this.otherId + tagStr;
        }
        else {
            throw new Error('Empty action id!');
        }
    }
    toProto() {
        const protoId = ActionIdProto.create({
            tag: this.tag,
        });
        if (this.itemId) {
            protoId.rawId = {
                oneofKind: 'itemId',
                itemId: this.itemId,
            };
        }
        else if (this.spellId) {
            protoId.rawId = {
                oneofKind: 'spellId',
                spellId: this.spellId,
            };
        }
        else if (this.otherId) {
            protoId.rawId = {
                oneofKind: 'otherId',
                otherId: this.otherId,
            };
        }
        return protoId;
    }
    toProtoString() {
        return ActionIdProto.toJsonString(this.toProto());
    }
    static fromEmpty() {
        return new ActionId(0, 0, OtherAction.OtherActionNone, 0, '', '');
    }
    static fromItemId(itemId, tag) {
        return new ActionId(itemId, 0, OtherAction.OtherActionNone, tag || 0, '', '');
    }
    static fromSpellId(spellId, tag) {
        return new ActionId(0, spellId, OtherAction.OtherActionNone, tag || 0, '', '');
    }
    static fromOtherId(otherId, tag) {
        return new ActionId(0, 0, otherId, tag || 0, '', '');
    }
    static fromItem(item) {
        return ActionId.fromItemId(getWowheadItemId(item));
    }
    static fromProto(protoId) {
        if (protoId.rawId.oneofKind == 'spellId') {
            return ActionId.fromSpellId(protoId.rawId.spellId, protoId.tag);
        }
        else if (protoId.rawId.oneofKind == 'itemId') {
            return ActionId.fromItemId(protoId.rawId.itemId, protoId.tag);
        }
        else if (protoId.rawId.oneofKind == 'otherId') {
            return ActionId.fromOtherId(protoId.rawId.otherId, protoId.tag);
        }
        else {
            return ActionId.fromEmpty();
        }
    }
    static fromLogString(str) {
        const match = str.match(/{((SpellID)|(ItemID)|(OtherID)): (\d+)(, Tag: (-?\d+))?}/);
        if (match) {
            const idType = match[1];
            const id = parseInt(match[5]);
            return new ActionId(idType == 'ItemID' ? id : 0, idType == 'SpellID' ? id : 0, idType == 'OtherID' ? id : 0, match[7] ? parseInt(match[7]) : 0, '', '');
        }
        else {
            console.warn('Failed to parse action id from log: ' + str);
            return ActionId.fromEmpty();
        }
    }
}
const itemToTooltipDataCache = new Map();
const spellToTooltipDataCache = new Map();
// Some items/spells have weird icons, so use this to show a different icon instead.
const idOverrides = {};
idOverrides[ActionId.fromSpellId(37212).toProtoString()] = ActionId.fromItemId(29035); // Improved Wrath of Air Totem
idOverrides[ActionId.fromSpellId(37447).toProtoString()] = ActionId.fromItemId(30720); // Serpent-Coil Braid
