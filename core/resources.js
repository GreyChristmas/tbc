import { REPO_NAME } from '/tbc/core/constants/other.js';
import { getWowheadItemId } from '/tbc/core/proto_utils/equipped_item.js';
import { NO_TARGET } from '/tbc/core/proto_utils/utils.js';
import { ItemSlot } from './proto/common.js';
import { OtherAction } from './proto/common.js';
// Get 'elemental_shaman', the pathname part after the repo name
const pathnameParts = window.location.pathname.split('/');
const repoPartIdx = pathnameParts.findIndex(part => part == REPO_NAME);
export const specDirectory = repoPartIdx == -1 ? '' : pathnameParts[repoPartIdx + 1];
const emptySlotIcons = {
    [ItemSlot.ItemSlotHead]: 'https://cdn.seventyupgrades.com/item-slots/Head.jpg',
    [ItemSlot.ItemSlotNeck]: 'https://cdn.seventyupgrades.com/item-slots/Neck.jpg',
    [ItemSlot.ItemSlotShoulder]: 'https://cdn.seventyupgrades.com/item-slots/Shoulders.jpg',
    [ItemSlot.ItemSlotBack]: 'https://cdn.seventyupgrades.com/item-slots/Back.jpg',
    [ItemSlot.ItemSlotChest]: 'https://cdn.seventyupgrades.com/item-slots/Chest.jpg',
    [ItemSlot.ItemSlotWrist]: 'https://cdn.seventyupgrades.com/item-slots/Wrists.jpg',
    [ItemSlot.ItemSlotHands]: 'https://cdn.seventyupgrades.com/item-slots/Hands.jpg',
    [ItemSlot.ItemSlotWaist]: 'https://cdn.seventyupgrades.com/item-slots/Waist.jpg',
    [ItemSlot.ItemSlotLegs]: 'https://cdn.seventyupgrades.com/item-slots/Legs.jpg',
    [ItemSlot.ItemSlotFeet]: 'https://cdn.seventyupgrades.com/item-slots/Feet.jpg',
    [ItemSlot.ItemSlotFinger1]: 'https://cdn.seventyupgrades.com/item-slots/Finger.jpg',
    [ItemSlot.ItemSlotFinger2]: 'https://cdn.seventyupgrades.com/item-slots/Finger.jpg',
    [ItemSlot.ItemSlotTrinket1]: 'https://cdn.seventyupgrades.com/item-slots/Trinket.jpg',
    [ItemSlot.ItemSlotTrinket2]: 'https://cdn.seventyupgrades.com/item-slots/Trinket.jpg',
    [ItemSlot.ItemSlotMainHand]: 'https://cdn.seventyupgrades.com/item-slots/MainHand.jpg',
    [ItemSlot.ItemSlotOffHand]: 'https://cdn.seventyupgrades.com/item-slots/OffHand.jpg',
    [ItemSlot.ItemSlotRanged]: 'https://cdn.seventyupgrades.com/item-slots/Ranged.jpg',
};
export function getEmptySlotIconUrl(slot) {
    return emptySlotIcons[slot];
}
// Some items/spells have weird icons, so use this to show a different icon instead.
const idOverrides = {};
idOverrides[JSON.stringify({ spellId: 37212 })] = { itemId: 29035 }; // Improved Wrath of Air Totem
idOverrides[JSON.stringify({ spellId: 37447 })] = { itemId: 30720 }; // Serpent-Coil Braid
async function getTooltipDataHelper(id, tooltipPostfix, cache) {
    if (!cache.has(id)) {
        cache.set(id, fetch(`https://tbc.wowhead.com/tooltip/${tooltipPostfix}/${id}`)
            .then(response => response.json()));
    }
    return cache.get(id);
}
const itemToTooltipDataCache = new Map();
const spellToTooltipDataCache = new Map();
export async function getTooltipData(id) {
    const idString = JSON.stringify(id);
    if (idOverrides[idString])
        id = idOverrides[idString];
    if ('itemId' in id) {
        return await getTooltipDataHelper(id.itemId, 'item', itemToTooltipDataCache);
    }
    else {
        return await getTooltipDataHelper(id.spellId, 'spell', spellToTooltipDataCache);
    }
}
function getOtherActionIconUrl(id) {
    throw new Error('No other actions!');
}
export async function getIconUrl(id) {
    if ('otherId' in id) {
        return getOtherActionIconUrl(id.otherId);
    }
    const tooltipData = await getTooltipData(id);
    return "https://wow.zamimg.com/images/wow/icons/large/" + tooltipData['icon'] + ".jpg";
}
export async function getItemIconUrl(item) {
    return getIconUrl({ itemId: getWowheadItemId(item) });
}
function getOtherActionName(id) {
    switch (id) {
        case OtherAction.OtherActionNone:
            return '';
        case OtherAction.OtherActionWait:
            return 'Wait';
        default:
            throw new Error('Invalid OtherAction: ' + id);
    }
}
export async function getName(id) {
    if ('otherId' in id) {
        return getOtherActionName(id.otherId);
    }
    const tooltipData = await getTooltipData(id);
    return tooltipData['name'];
}
export async function getFullActionName(actionId, playerIndex) {
    const tag = actionId.tag || 0;
    let name = await getName(actionId.id);
    switch (name) {
        case 'Fireball':
        case 'Pyroblast':
            if (tag)
                name += ' (DoT)';
            break;
        case 'Mind Flay':
            if (tag == 1) {
                name += ' (1 Tick)';
            }
            else if (tag == 2) {
                name += ' (2 Tick)';
            }
            else if (tag == 3) {
                name += ' (3 Tick)';
            }
            break;
        case 'Lightning Bolt':
            if (tag)
                name += ' (LO)';
            break;
        // For targetted buffs, tag is the source player's raid index or -1 if none.
        case 'Bloodlust':
        case 'Innervate':
        case 'Mana Tide Totem':
        case 'Power Infusion':
            if (tag != NO_TARGET) {
                if (tag === playerIndex) {
                    name += ` (self)`;
                }
                else {
                    name += ` (from #${tag + 1})`;
                }
            }
            break;
        default:
            if (tag == 10) {
                name += ' (Auto)';
            }
            else if (tag == 11) {
                name += ' (Offhand Auto)';
            }
            else if (tag) {
                name += ' (??)';
            }
            break;
    }
    return name;
}
export function setWowheadHref(elem, id) {
    if ('itemId' in id) {
        elem.href = 'https://tbc.wowhead.com/item=' + id.itemId;
    }
    else if ('spellId' in id) {
        elem.href = 'https://tbc.wowhead.com/spell=' + id.spellId;
    }
}
export function setWowheadItemHref(elem, item) {
    return setWowheadHref(elem, { itemId: getWowheadItemId(item) });
}
