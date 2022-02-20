import { RaidBuffs, StrengthOfEarthType } from '/tbc/core/proto/common.js';
import { PartyBuffs } from '/tbc/core/proto/common.js';
import { IndividualBuffs } from '/tbc/core/proto/common.js';
import { Debuffs } from '/tbc/core/proto/common.js';
import { Drums } from '/tbc/core/proto/common.js';
import { Stat } from '/tbc/core/proto/common.js';
import { TristateEffect } from '/tbc/core/proto/common.js';
import { Stats } from '/tbc/core/proto_utils/stats.js';
import { IndividualSimUI } from '/tbc/core/individual_sim_ui.js';
import * as IconInputs from '/tbc/core/components/icon_inputs.js';
import * as OtherInputs from '/tbc/core/components/other_inputs.js';
import * as RetributionPaladinInputs from './inputs.js';
import * as Presets from './presets.js';
export class RetributionPaladinSimUI extends IndividualSimUI {
    constructor(parentElem, player) {
        super(parentElem, player, {
            cssClass: 'retribution-paladin-sim-ui',
            // List any known bugs / issues here and they'll be shown on the site.
            knownIssues: [
                "Basically everything is WIP"
            ],
            // All stats for which EP should be calculated.
            epStats: [
                Stat.StatStrength,
                Stat.StatAgility,
                Stat.StatIntellect,
                Stat.StatAttackPower,
                Stat.StatMeleeHit,
                Stat.StatMeleeCrit,
                Stat.StatExpertise,
                Stat.StatMeleeHaste,
                Stat.StatArmorPenetration,
                Stat.StatSpellPower,
                Stat.StatSpellCrit,
                Stat.StatSpellHit,
            ],
            // Reference stat against which to calculate EP. I think all classes use either spell power or attack power.
            epReferenceStat: Stat.StatAttackPower,
            // Which stats to display in the Character Stats section, at the bottom of the left-hand sidebar.
            displayStats: [
                Stat.StatStamina,
                Stat.StatStrength,
                Stat.StatAgility,
                Stat.StatIntellect,
                Stat.StatMP5,
                Stat.StatAttackPower,
                Stat.StatMeleeHit,
                Stat.StatMeleeCrit,
                Stat.StatMeleeHaste,
                Stat.StatExpertise,
                Stat.StatArmorPenetration,
                Stat.StatSpellPower,
                Stat.StatHolySpellPower,
                Stat.StatSpellHit,
                Stat.StatSpellCrit,
                Stat.StatSpellHaste,
            ],
            defaults: {
                // Default equipped gear.
                gear: Presets.P3_PRESET.gear,
                // Default EP weights for sorting gear in the gear picker.
                epWeights: Stats.fromMap({
                    [Stat.StatStrength]: 2.42,
                    [Stat.StatAgility]: 1.88,
                    [Stat.StatIntellect]: 0,
                    [Stat.StatAttackPower]: 1,
                    [Stat.StatMeleeHit]: 5.38,
                    [Stat.StatMeleeCrit]: 1.98,
                    [Stat.StatExpertise]: 4.70,
                    [Stat.StatMeleeHaste]: 3.27,
                    [Stat.StatArmorPenetration]: 0.24,
                    [Stat.StatSpellPower]: 0.35,
                    [Stat.StatSpellCrit]: 0,
                    [Stat.StatSpellHit]: 0,
                }),
                // Default consumes settings.
                consumes: Presets.DefaultConsumes,
                // Default rotation settings.
                rotation: Presets.DefaultRotation,
                // Default talents.
                talents: Presets.RetKingsPaladinTalents.data,
                // Default spec-specific settings.
                specOptions: Presets.DefaultOptions,
                // Default raid/party buffs settings.
                raidBuffs: RaidBuffs.create({
                    arcaneBrilliance: true,
                    divineSpirit: TristateEffect.TristateEffectImproved,
                    giftOfTheWild: TristateEffect.TristateEffectImproved,
                }),
                partyBuffs: PartyBuffs.create({
                    bloodlust: 1,
                    drums: Drums.DrumsOfBattle,
                    braidedEterniumChain: true,
                    manaSpringTotem: TristateEffect.TristateEffectRegular,
                    strengthOfEarthTotem: StrengthOfEarthType.EnhancingTotems,
                    windfuryTotemRank: 5,
                    battleShout: TristateEffect.TristateEffectImproved,
                    windfuryTotemIwt: 2,
                }),
                individualBuffs: IndividualBuffs.create({
                    blessingOfKings: true,
                    blessingOfMight: TristateEffect.TristateEffectImproved,
                    unleashedRage: true,
                }),
                debuffs: Debuffs.create({
                    judgementOfWisdom: true,
                    misery: true,
                    curseOfElements: TristateEffect.TristateEffectImproved,
                    isbUptime: 1,
                    bloodFrenzy: true,
                    exposeArmor: TristateEffect.TristateEffectImproved,
                    faerieFire: TristateEffect.TristateEffectImproved,
                    curseOfRecklessness: true,
                    huntersMark: TristateEffect.TristateEffectImproved,
                    exposeWeaknessUptime: 1,
                    exposeWeaknessHunterAgility: 800,
                }),
            },
            // IconInputs to include in the 'Self Buffs' section on the settings tab.
            selfBuffInputs: [
                IconInputs.DrumsOfBattleConsume,
                IconInputs.BattleChicken,
            ],
            // IconInputs to include in the 'Other Buffs' section on the settings tab.
            raidBuffInputs: [
                IconInputs.ArcaneBrilliance,
                IconInputs.GiftOfTheWild,
                IconInputs.DivineSpirit,
            ],
            partyBuffInputs: [
                IconInputs.DrumsOfBattleBuff,
                IconInputs.Bloodlust,
                IconInputs.ManaSpringTotem,
                IconInputs.WindfuryTotem,
                IconInputs.StrengthOfEarthTotem,
                IconInputs.GraceOfAirTotem,
                IconInputs.BattleShout,
                IconInputs.DraeneiRacialMelee,
                IconInputs.LeaderOfThePack,
                IconInputs.FerociousInspiration,
                IconInputs.TrueshotAura,
                IconInputs.BattleChickens,
                IconInputs.BraidedEterniumChain,
            ],
            playerBuffInputs: [
                IconInputs.BlessingOfKings,
                IconInputs.BlessingOfWisdom,
                IconInputs.BlessingOfMight,
                IconInputs.UnleashedRage,
            ],
            // IconInputs to include in the 'Debuffs' section on the settings tab.
            debuffInputs: [
                IconInputs.JudgementOfWisdom,
                IconInputs.ImprovedSealOfTheCrusader,
                IconInputs.ExposeArmor,
                IconInputs.SunderArmor,
                IconInputs.BloodFrenzy,
                IconInputs.HuntersMark,
                IconInputs.FaerieFire,
                IconInputs.CurseOfRecklessness,
                IconInputs.CurseOfElements,
                IconInputs.Misery,
            ],
            // IconInputs to include in the 'Consumes' section on the settings tab.
            consumeInputs: [
                IconInputs.DefaultHastePotion,
                IconInputs.DefaultSuperManaPotion,
                IconInputs.DefaultDarkRune,
                IconInputs.DefaultFlameCap,
                IconInputs.FlaskOfRelentlessAssault,
                IconInputs.ElixirOfDemonslaying,
                IconInputs.ElixirOfMajorAgility,
                IconInputs.ElixirOfMajorStrength,
                IconInputs.ElixirOfTheMongoose,
                IconInputs.ElixirOfMajorMageblood,
                IconInputs.ElixirOfDraenicWisdom,
                IconInputs.MainHandAdamantiteSharpeningStone,
                IconInputs.MainHandElementalSharpeningStone,
                IconInputs.MainHandSuperiorWizardOil,
                IconInputs.MainHandBrilliantWizardOil,
                IconInputs.RoastedClefthoof,
                IconInputs.SpicyHotTalbuk,
                IconInputs.GrilledMudfish,
                IconInputs.BlackenedBasilisk,
                IconInputs.ScrollOfStrengthV,
                IconInputs.ScrollOfStrengthV,
            ],
            // Inputs to include in the 'Rotation' section on the settings tab.
            rotationInputs: RetributionPaladinInputs.RetributionPaladinRotationConfig,
            // Inputs to include in the 'Other' section on the settings tab.
            otherInputs: {
                inputs: [
                    RetributionPaladinInputs.JudgementSelection,
                    RetributionPaladinInputs.CrusaderStrikeDelayMS,
                    RetributionPaladinInputs.HasteLeewayMS,
                    RetributionPaladinInputs.DamgeTakenPerSecond,
                    OtherInputs.ExposeWeaknessUptime,
                    OtherInputs.ExposeWeaknessHunterAgility,
                    OtherInputs.ISBUptime,
                ],
            },
            encounterPicker: {
                // Whether to include 'Target Armor' in the 'Encounter' section of the settings tab.
                showTargetArmor: true,
                // Whether to include 'Execute Duration (%)' in the 'Encounter' section of the settings tab.
                showExecuteProportion: false,
                // Whether to include 'Num Targets' in the 'Encounter' section of the settings tab.
                showNumTargets: true,
            },
            // If true, the talents on the talents tab will not be individually modifiable by the user.
            // Note that the use can still pick between preset talents, if there is more than 1.
            freezeTalents: false,
            presets: {
                // Preset talents that the user can quickly select.
                talents: [
                    Presets.RetKingsPaladinTalents,
                    Presets.RetNoKingsPaladinTalents,
                ],
                // Preset gear configurations that the user can quickly select.
                gear: [
                    Presets.PRE_RAID_PRESET,
                    Presets.P1_PRESET,
                    Presets.P2_PRESET,
                    Presets.P3_PRESET,
                    Presets.P4_PRESET,
                    Presets.P5_PRESET,
                ],
            },
        });
    }
}
