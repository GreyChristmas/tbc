import { Drums } from '/tbc/core/proto/common.js';
import { Potions } from '/tbc/core/proto/common.js';
// Keep each section in alphabetical order.
// Buffs
export const ArcaneBrilliance = makeBooleanBuffInput({ spellId: 27127 }, 'arcaneBrilliance');
export const AtieshMage = makeMultistateBuffInput({ spellId: 28142 }, 5, 'atieshMage');
export const AtieshWarlock = makeMultistateBuffInput({ spellId: 28143 }, 5, 'atieshWarlock');
export const BlessingOfKings = makeBooleanBuffInput({ spellId: 25898 }, 'blessingOfKings');
export const BlessingOfWisdom = makeTristateBuffInput({ spellId: 27143 }, { spellId: 20245 }, 'blessingOfWisdom');
export const Bloodlust = makeMultistateBuffInput({ spellId: 2825 }, 11, 'bloodlust');
export const BraidedEterniumChain = makeBooleanBuffInput({ spellId: 31025 }, 'braidedEterniumChain');
export const ChainOfTheTwilightOwl = makeBooleanBuffInput({ spellId: 31035 }, 'chainOfTheTwilightOwl');
export const DraeneiRacialCaster = makeBooleanBuffInput({ spellId: 28878 }, 'draeneiRacialCaster');
export const DraeneiRacialMelee = makeBooleanBuffInput({ spellId: 6562 }, 'draeneiRacialMelee');
export const DivineSpirit = makeTristateBuffInput({ spellId: 25312 }, { spellId: 33182 }, 'divineSpirit');
export const EyeOfTheNight = makeBooleanBuffInput({ spellId: 31033 }, 'eyeOfTheNight');
export const GiftOfTheWild = makeTristateBuffInput({ spellId: 26991 }, { spellId: 17055 }, 'giftOfTheWild');
export const JadePendantOfBlasting = makeBooleanBuffInput({ spellId: 25607 }, 'jadePendantOfBlasting');
export const ManaSpringTotem = makeTristateBuffInput({ spellId: 25570 }, { spellId: 16208 }, 'manaSpringTotem');
export const ManaTideTotem = makeBooleanBuffInput({ spellId: 16190 }, 'manaTideTotem');
export const MoonkinAura = makeTristateBuffInput({ spellId: 24907 }, { itemId: 32387 }, 'moonkinAura');
export const TotemOfWrath = makeMultistateBuffInput({ spellId: 30706 }, 5, 'totemOfWrath');
export const WrathOfAirTotem = makeTristateBuffInput({ spellId: 3738 }, { spellId: 37212 }, 'wrathOfAirTotem');
export const DrumsOfBattleBuff = makeEnumValueBuffInput({ spellId: 35476 }, 'drums', Drums.DrumsOfBattle, ['Drums']);
export const DrumsOfRestorationBuff = makeEnumValueBuffInput({ spellId: 35478 }, 'drums', Drums.DrumsOfRestoration, ['Drums']);
// Debuffs
export const ImprovedSealOfTheCrusader = makeBooleanBuffInput({ spellId: 20337 }, 'improvedSealOfTheCrusader');
export const JudgementOfWisdom = makeBooleanBuffInput({ spellId: 27164 }, 'judgementOfWisdom');
export const Misery = makeBooleanBuffInput({ spellId: 33195 }, 'misery');
// Consumes
export const AdeptsElixir = makeBooleanConsumeInput({ itemId: 28103 }, 'adeptsElixir', ['Battle Elixir']);
export const BlackenedBasilisk = makeBooleanConsumeInput({ itemId: 27657 }, 'blackenedBasilisk', ['Food']);
export const BrilliantWizardOil = makeBooleanConsumeInput({ itemId: 20749 }, 'brilliantWizardOil', ['Weapon Imbue']);
export const DarkRune = makeBooleanConsumeInput({ itemId: 12662 }, 'darkRune', ['Rune']);
export const ElixirOfDraenicWisdom = makeBooleanConsumeInput({ itemId: 32067 }, 'elixirOfDraenicWisdom', ['Guardian Elixir']);
export const ElixirOfMajorFirePower = makeBooleanConsumeInput({ itemId: 22833 }, 'elixirOfMajorFirePower', ['Battle Elixir']);
export const ElixirOfMajorFrostPower = makeBooleanConsumeInput({ itemId: 22827 }, 'elixirOfMajorFrostPower', ['Battle Elixir']);
export const ElixirOfMajorMageblood = makeBooleanConsumeInput({ itemId: 22840 }, 'elixirOfMajorMageblood', ['Guardian Elixir']);
export const ElixirOfMajorShadowPower = makeBooleanConsumeInput({ itemId: 22835 }, 'elixirOfMajorShadowPower', ['Battle Elixir']);
export const FlaskOfBlindingLight = makeBooleanConsumeInput({ itemId: 22861 }, 'flaskOfBlindingLight', ['Battle Elixir', 'Guardian Elixir']);
export const FlaskOfMightyRestoration = makeBooleanConsumeInput({ itemId: 22853 }, 'flaskOfMightyRestoration', ['Battle Elixir', 'Guardian Elixir']);
export const FlaskOfPureDeath = makeBooleanConsumeInput({ itemId: 22866 }, 'flaskOfPureDeath', ['Battle Elixir', 'Guardian Elixir']);
export const FlaskOfSupremePower = makeBooleanConsumeInput({ itemId: 13512 }, 'flaskOfSupremePower', ['Battle Elixir', 'Guardian Elixir']);
export const SkullfishSoup = makeBooleanConsumeInput({ itemId: 33825 }, 'skullfishSoup', ['Food']);
export const SuperiorWizardOil = makeBooleanConsumeInput({ itemId: 22522 }, 'superiorWizardOil', ['Weapon Imbue']);
export const DefaultDestructionPotion = makeEnumValueConsumeInput({ itemId: 22839 }, 'defaultPotion', Potions.DestructionPotion, ['Potion']);
export const DefaultSuperManaPotion = makeEnumValueConsumeInput({ itemId: 22832 }, 'defaultPotion', Potions.SuperManaPotion, ['Potion']);
export const DrumsOfBattleConsume = makeEnumValueConsumeInput({ spellId: 35476 }, 'drums', Drums.DrumsOfBattle, ['Drums']);
export const DrumsOfRestorationConsume = makeEnumValueConsumeInput({ spellId: 35478 }, 'drums', Drums.DrumsOfRestoration, ['Drums']);
function makeBooleanBuffInput(id, buffsFieldName, exclusivityTags) {
    return {
        id: id,
        states: 2,
        exclusivityTags: exclusivityTags,
        changedEvent: (sim) => sim.buffsChangeEmitter,
        getValue: (sim) => sim.getBuffs()[buffsFieldName],
        setBooleanValue: (sim, newValue) => {
            const newBuffs = sim.getBuffs();
            newBuffs[buffsFieldName] = newValue;
            sim.setBuffs(newBuffs);
        },
    };
}
function makeTristateBuffInput(id, impId, buffsFieldName) {
    return {
        id: id,
        states: 3,
        improvedId: impId,
        changedEvent: (sim) => sim.buffsChangeEmitter,
        getValue: (sim) => sim.getBuffs()[buffsFieldName],
        setNumberValue: (sim, newValue) => {
            const newBuffs = sim.getBuffs();
            newBuffs[buffsFieldName] = newValue;
            sim.setBuffs(newBuffs);
        },
    };
}
function makeMultistateBuffInput(id, numStates, buffsFieldName) {
    return {
        id: id,
        states: numStates,
        changedEvent: (sim) => sim.buffsChangeEmitter,
        getValue: (sim) => sim.getBuffs()[buffsFieldName],
        setNumberValue: (sim, newValue) => {
            const newBuffs = sim.getBuffs();
            newBuffs[buffsFieldName] = newValue;
            sim.setBuffs(newBuffs);
        },
    };
}
function makeEnumValueBuffInput(id, buffsFieldName, enumValue, exclusivityTags) {
    return {
        id: id,
        states: 2,
        exclusivityTags: exclusivityTags,
        changedEvent: (sim) => sim.buffsChangeEmitter,
        getValue: (sim) => sim.getBuffs()[buffsFieldName] == enumValue,
        setBooleanValue: (sim, newValue) => {
            const newBuffs = sim.getBuffs();
            newBuffs[buffsFieldName] = newValue ? enumValue : 0;
            sim.setBuffs(newBuffs);
        },
    };
}
function makeBooleanConsumeInput(id, consumesFieldName, exclusivityTags) {
    return {
        id: id,
        states: 2,
        exclusivityTags: exclusivityTags,
        changedEvent: (sim) => sim.consumesChangeEmitter,
        getValue: (sim) => sim.getConsumes()[consumesFieldName],
        setBooleanValue: (sim, newValue) => {
            const newBuffs = sim.getConsumes();
            newBuffs[consumesFieldName] = newValue;
            sim.setConsumes(newBuffs);
        },
    };
}
function makeEnumValueConsumeInput(id, consumesFieldName, enumValue, exclusivityTags) {
    return {
        id: id,
        states: 2,
        exclusivityTags: exclusivityTags,
        changedEvent: (sim) => sim.consumesChangeEmitter,
        getValue: (sim) => sim.getConsumes()[consumesFieldName] == enumValue,
        setBooleanValue: (sim, newValue) => {
            const newConsumes = sim.getConsumes();
            newConsumes[consumesFieldName] = newValue ? enumValue : 0;
            sim.setConsumes(newConsumes);
        },
    };
}
