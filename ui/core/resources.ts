import { getWowheadItemId } from '/tbc/core/proto_utils/equipped_item.js';
import { GemColor } from './proto/common.js';
import { Item } from './proto/common.js';
import { ItemQuality } from './proto/common.js';
import { ItemSlot } from './proto/common.js';

// Github pages serves our site under the /tbc directory (because the repo name is tbc)
export const repoName = 'tbc';

// Get 'elemental_shaman', the pathname part after the repo name
const pathnameParts = window.location.pathname.split('/');
const repoPartIdx = pathnameParts.findIndex(part => part == repoName);
export const specDirectory = repoPartIdx == -1 ? '' : pathnameParts[repoPartIdx + 1];

const emptySlotIcons: Record<ItemSlot, string> = {
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
export function getEmptySlotIconUrl(slot: ItemSlot): string {
  return emptySlotIcons[slot];
}

export type ItemId = {
  itemId: number;
};
export type SpellId = {
  spellId: number;
};
export type OtherId = {
  otherId: number;
};
export type ItemOrSpellId = ItemId | SpellId;
export type ActionId = ItemId | SpellId | OtherId;

// Some items/spells have weird icons, so use this to show a different icon instead.
const idOverrides: Record<string, ItemOrSpellId> = {};
idOverrides[JSON.stringify({spellId: 37212})] = { itemId: 29035 }; // Improved Wrath of Air Totem

async function getTooltipDataHelper(id: number, tooltipPostfix: string, cache: Map<number, Promise<any>>): Promise<any> {
  if (!cache.has(id)) {
		cache.set(id,
				fetch(`https://tbc.wowhead.com/tooltip/${tooltipPostfix}/${id}`)
				.then(response => response.json()));
  }

	return cache.get(id) as Promise<any>;
}

const itemToTooltipDataCache = new Map<number, Promise<any>>();
const spellToTooltipDataCache = new Map<number, Promise<any>>();
export async function getTooltipData(id: ItemOrSpellId): Promise<any> {
  const idString = JSON.stringify(id);
  if (idOverrides[idString])
    id = idOverrides[idString];

  if ('itemId' in id) {
    return await getTooltipDataHelper(id.itemId, 'item', itemToTooltipDataCache);
  } else {
    return await getTooltipDataHelper(id.spellId, 'spell', spellToTooltipDataCache);
  }
}
function getOtherActionIconUrl(id: number): string {
	throw new Error('No other actions!');
}
export async function getIconUrl(id: ActionId): Promise<string> {
	if ('otherId' in id) {
		return getOtherActionIconUrl(id.otherId);
	}

	const tooltipData = await getTooltipData(id);
	return "https://wow.zamimg.com/images/wow/icons/large/" + tooltipData['icon'] + ".jpg";
}

export async function getItemIconUrl(item: Item): Promise<string> {
	return getIconUrl({ itemId: getWowheadItemId(item) });
}

function getOtherActionName(id: number): string {
	throw new Error('No other actions!');
}
export async function getName(id: ItemOrSpellId | ActionId): Promise<string> {
	if ('otherId' in id) {
		return getOtherActionName(id.otherId);
	}

	const tooltipData = await getTooltipData(id);
	return tooltipData['name'];
}

export function setWowheadHref(elem: HTMLAnchorElement, id: ItemOrSpellId) {
  if ('itemId' in id) {
    elem.href = 'https://tbc.wowhead.com/item=' + id.itemId;
  } else {
    elem.href = 'https://tbc.wowhead.com/spell=' + id.spellId;
  }
}

export function setWowheadItemHref(elem: HTMLAnchorElement, item: Item) {
	return setWowheadHref(elem, { itemId: getWowheadItemId(item) });
}

const emptyGemSocketIcons: Partial<Record<GemColor, string>> = {
  [GemColor.GemColorBlue]: 'https://wow.zamimg.com/images/icons/socket-blue.gif',
  [GemColor.GemColorMeta]: 'https://wow.zamimg.com/images/icons/socket-meta.gif',
  [GemColor.GemColorRed]: 'https://wow.zamimg.com/images/icons/socket-red.gif',
  [GemColor.GemColorYellow]: 'https://wow.zamimg.com/images/icons/socket-yellow.gif',
};
export function getEmptyGemSocketIconUrl(color: GemColor): string {
  if (emptyGemSocketIcons[color])
    return emptyGemSocketIcons[color] as string;

  throw new Error('No empty socket url for gem socket color: ' + color);
}
