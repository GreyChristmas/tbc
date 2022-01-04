import { GemColor } from '/tbc/core/proto/common.js';
const socketToMatchingColors = new Map();
socketToMatchingColors.set(GemColor.GemColorMeta, [GemColor.GemColorMeta]);
socketToMatchingColors.set(GemColor.GemColorBlue, [GemColor.GemColorBlue, GemColor.GemColorPurple, GemColor.GemColorGreen]);
socketToMatchingColors.set(GemColor.GemColorRed, [GemColor.GemColorRed, GemColor.GemColorPurple, GemColor.GemColorOrange]);
socketToMatchingColors.set(GemColor.GemColorYellow, [GemColor.GemColorYellow, GemColor.GemColorOrange, GemColor.GemColorGreen]);
// Whether the gem matches the given socket color, for the purposes of gaining the socket bonuses.
export function gemMatchesSocket(gem, socketColor) {
    return socketToMatchingColors.has(socketColor) && socketToMatchingColors.get(socketColor).includes(gem.color);
}
// Whether the gem is capable of slotting into a socket of the given color.
export function gemEligibleForSocket(gem, socketColor) {
    return (gem.color == GemColor.GemColorMeta) == (socketColor == GemColor.GemColorMeta);
}
// Maps meta gem IDs to functions that check whether they're active.
const metaGemActiveConditions = new Map();
// Maps meta gem IDs to string descriptions of the meta conditions.
const metaGemConditionDescriptions = new Map();
export function isMetaGemActive(metaGem, numRed, numYellow, numBlue) {
    if (!metaGemActiveConditions.has(metaGem.id)) {
        // If we don't have a condition for this meta gem, just default to active.
        return true;
    }
    return metaGemActiveConditions.get(metaGem.id)(numRed, numYellow, numBlue);
}
export function getMetaGemConditionDescription(metaGem) {
    return metaGemConditionDescriptions.get(metaGem.id) || '';
}
// Keep these lists in alphabetical order, separated by color.
// Meta
export const BRACING_EARTHSTORM_DIAMOND = 25897;
metaGemConditionDescriptions.set(BRACING_EARTHSTORM_DIAMOND, 'Requires more Red Gems than Blue Gems.');
metaGemActiveConditions.set(BRACING_EARTHSTORM_DIAMOND, (numRed, numYellow, numBlue) => numRed > numBlue);
export const CHAOTIC_SKYFIRE_DIAMOND = 34220;
metaGemConditionDescriptions.set(CHAOTIC_SKYFIRE_DIAMOND, 'Requires at least 2 Blue Gems.');
metaGemActiveConditions.set(CHAOTIC_SKYFIRE_DIAMOND, (numRed, numYellow, numBlue) => numBlue >= 2);
export const EMBER_SKYFIRE_DIAMOND = 35503;
metaGemConditionDescriptions.set(EMBER_SKYFIRE_DIAMOND, 'Requires at least 3 Red Gems.');
metaGemActiveConditions.set(EMBER_SKYFIRE_DIAMOND, (numRed, numYellow, numBlue) => numRed >= 3);
export const IMBUED_UNSTABLE_DIAMOND = 32641;
metaGemConditionDescriptions.set(IMBUED_UNSTABLE_DIAMOND, 'Requires at least 3 Yellow Gems.');
metaGemActiveConditions.set(IMBUED_UNSTABLE_DIAMOND, (numRed, numYellow, numBlue) => numYellow >= 3);
export const INSIGHTFUL_EARTHSTORM_DIAMOND = 25901;
metaGemConditionDescriptions.set(INSIGHTFUL_EARTHSTORM_DIAMOND, 'Requires at least 2 Red Gems, at least 2 Yellow Gems, and at least 2 Blue gems.');
metaGemActiveConditions.set(INSIGHTFUL_EARTHSTORM_DIAMOND, (numRed, numYellow, numBlue) => numRed >= 2 && numYellow >= 2 && numBlue >= 2);
export const MYSTICAL_SKYFIRE_DIAMOND = 25893;
metaGemConditionDescriptions.set(MYSTICAL_SKYFIRE_DIAMOND, 'Requires more Blue Gems than Yellow Gems.');
metaGemActiveConditions.set(MYSTICAL_SKYFIRE_DIAMOND, (numRed, numYellow, numBlue) => numBlue > numYellow);
export const SWIFT_STARFIRE_DIAMOND = 28557;
metaGemConditionDescriptions.set(SWIFT_STARFIRE_DIAMOND, 'Requires at least 2 Yellow Gems and at least 1 Red Gem.');
metaGemActiveConditions.set(SWIFT_STARFIRE_DIAMOND, (numRed, numYellow, numBlue) => numYellow >= 2 && numRed >= 1);
export const RELENTLESS_EARTHSTORM_DIAMOND = 32409;
metaGemConditionDescriptions.set(RELENTLESS_EARTHSTORM_DIAMOND, 'Requires at least 2 Red Gems. Requires at least 2 Yellow Gems. Requires at least 2 Blue Gems');
metaGemActiveConditions.set(RELENTLESS_EARTHSTORM_DIAMOND, (numRed, numYellow, numBlue) => numYellow >= 2 && numRed >= 2 && numBlue >= 2);
// Orange
export const INSCRIBED_NOBLE_TOPAZ = 24058;
export const POTENT_NOBLE_TOPAZ = 24059;
export const POTENT_PYRESTONE = 32218;
export const VEILED_NOBLE_TOPAZ = 31867;
export const VEILED_PYRESTONE = 32221;
// Purple
export const GLOWING_NIGHTSEYE = 24056;
export const SOVEREIGN_NIGHTSEYE = 24054;
export const GLOWING_SHADOWSONG_AMETHYST = 32215;
// Red
export const RUNED_CRIMSON_SPINEL = 32196;
export const BOLD_LIVING_RUBY = 24027;
export const RUNED_LIVING_RUBY = 24030;
export const RUNED_ORNATE_RUBY = 28118;
// Yellow
export const BRILLIANT_DAWNSTONE = 24047;
export const BRILLIANT_LIONSEYE = 32204;
const gemSocketCssClasses = {
    [GemColor.GemColorBlue]: 'socket-color-blue',
    [GemColor.GemColorMeta]: 'socket-color-meta',
    [GemColor.GemColorRed]: 'socket-color-red',
    [GemColor.GemColorYellow]: 'socket-color-yellow',
};
export function setGemSocketCssClass(elem, color) {
    Object.values(gemSocketCssClasses).forEach(cssClass => elem.classList.remove(cssClass));
    if (gemSocketCssClasses[color]) {
        elem.classList.add(gemSocketCssClasses[color]);
        return;
    }
    throw new Error('No css class for gem socket color: ' + color);
}
const emptyGemSocketIcons = {
    [GemColor.GemColorBlue]: 'https://wow.zamimg.com/images/icons/socket-blue.gif',
    [GemColor.GemColorMeta]: 'https://wow.zamimg.com/images/icons/socket-meta.gif',
    [GemColor.GemColorRed]: 'https://wow.zamimg.com/images/icons/socket-red.gif',
    [GemColor.GemColorYellow]: 'https://wow.zamimg.com/images/icons/socket-yellow.gif',
};
export function getEmptyGemSocketIconUrl(color) {
    if (emptyGemSocketIcons[color])
        return emptyGemSocketIcons[color];
    throw new Error('No empty socket url for gem socket color: ' + color);
}
