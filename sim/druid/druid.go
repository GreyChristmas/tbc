package druid

import (
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/proto"
	"github.com/wowsims/tbc/sim/core/stats"
)

type Druid struct {
	core.Character
	SelfBuffs
	Talents proto.DruidTalents

	innervateCD  time.Duration
	NaturesGrace bool // when true next spellcast is 0.5s faster

	// cached cast stuff
	starfireSpell         core.SingleTargetDirectDamageSpell
	starfire8CastTemplate core.SingleTargetDirectDamageSpellTemplate
	starfire6CastTemplate core.SingleTargetDirectDamageSpellTemplate

	MoonfireSpell        core.DamageOverTimeSpell
	moonfireCastTemplate core.DamageOverTimeSpellTemplate

	wrathSpell        core.SingleTargetDirectDamageSpell
	wrathCastTemplate core.SingleTargetDirectDamageSpellTemplate

	InsectSwarmSpell        core.DamageOverTimeSpell
	insectSwarmCastTemplate core.DamageOverTimeSpellTemplate

	malorne4p bool // cached since we need to check on every innervate
}

type SelfBuffs struct {
	Omen      bool
	Innervate bool
}

func (druid *Druid) GetCharacter() *core.Character {
	return &druid.Character
}

func (druid *Druid) AddRaidBuffs(raidBuffs *proto.RaidBuffs) {
	raidBuffs.GiftOfTheWild = core.MaxTristate(raidBuffs.GiftOfTheWild, proto.TristateEffect_TristateEffectRegular)
	if druid.Talents.ImprovedMarkOfTheWild == 5 { // probably could work on actually calculating the fraction effect later if we care.
		raidBuffs.GiftOfTheWild = proto.TristateEffect_TristateEffectImproved
	}
}

const ravenGoddessItemID = 32387

func (druid *Druid) AddPartyBuffs(partyBuffs *proto.PartyBuffs) {
	if druid.Talents.MoonkinForm { // assume if you have moonkin talent you are using it.
		partyBuffs.MoonkinAura = core.MaxTristate(partyBuffs.MoonkinAura, proto.TristateEffect_TristateEffectRegular)
		for _, e := range druid.Equip {
			if e.ID == ravenGoddessItemID {
				partyBuffs.MoonkinAura = proto.TristateEffect_TristateEffectImproved
				break
			}
		}
	}
}

func (druid *Druid) Init(sim *core.Simulation) {
	druid.starfire8CastTemplate = druid.newStarfireTemplate(sim, 8)
	druid.starfire6CastTemplate = druid.newStarfireTemplate(sim, 6)
	druid.moonfireCastTemplate = druid.newMoonfireTemplate(sim)
	druid.wrathCastTemplate = druid.newWrathTemplate(sim)
	druid.insectSwarmCastTemplate = druid.newInsectSwarmTemplate(sim)
}

func (druid *Druid) Reset(newsim *core.Simulation) {
	// Cleanup and pending dots and casts
	druid.MoonfireSpell = core.DamageOverTimeSpell{}
	druid.InsectSwarmSpell = core.DamageOverTimeSpell{}
	druid.starfireSpell = core.SingleTargetDirectDamageSpell{}
	druid.wrathSpell = core.SingleTargetDirectDamageSpell{}

	druid.Character.Reset(newsim)
}

func (druid *Druid) Advance(sim *core.Simulation, elapsedTime time.Duration) {
	// druid should never be outside the 5s window, use combat regen.
	druid.Character.CombatManaRegen(sim, elapsedTime)
	druid.Character.Advance(sim, elapsedTime)
}

var InnervateCD = core.NewCooldownID()

// TODO: This probably needs to allow for multiple innervates later
//  would need to solve the same issue we had as dots (maybe ID per user)
var InnervateAuraID = core.NewAuraID()

func (druid *Druid) TryInnervate(sim *core.Simulation) bool {
	// Currently just activates innervate on self when own mana is <75%
	// TODO: get a real recommendation when to use this.
	if druid.SelfBuffs.Innervate && druid.GetRemainingCD(InnervateCD, sim.CurrentTime) == 0 {
		if druid.GetStat(stats.Mana)/druid.MaxMana() < 0.75 {
			oldRegen := druid.PsuedoStats.SpiritRegenRateCasting
			druid.PsuedoStats.SpiritRegenRateCasting = 1.0
			druid.PsuedoStats.ManaRegenMultiplier *= 5.0
			druid.AddAura(sim, core.Aura{
				ID:      InnervateAuraID,
				Name:    "Innervate",
				Expires: sim.CurrentTime + time.Second*20,
				OnExpire: func(sim *core.Simulation) {
					druid.PsuedoStats.SpiritRegenRateCasting = oldRegen
					druid.PsuedoStats.ManaRegenMultiplier /= 5.0
				},
			})
			cd := time.Minute * 6
			if druid.malorne4p {
				cd -= time.Second * 48
			}
			druid.SetCD(InnervateCD, cd)
			// triggers GCD
			druid.SetCD(core.GCDCooldownID, core.CalculatedGCD(&druid.Character))
			return true
		}
	}
	return false
}
func (druid *Druid) Act(sim *core.Simulation) time.Duration {
	return core.NeverExpires // does nothing
}

func (druid *Druid) applyOnHitTalents(sim *core.Simulation, spellCast *core.SpellCast, spellEffect *core.SpellEffect) {
	if druid.Talents.NaturesGrace && spellEffect.Crit {
		druid.NaturesGrace = true
	}
}

func (druid *Druid) applyNaturesGrace(spellCast *core.SpellCast) {
	if druid.NaturesGrace {
		spellCast.CastTime -= time.Millisecond * 500
		// This applies on cast complete, removing the effect.
		//  if it crits, during 'onspellhit' then it will be reapplied (see func above)
		spellCast.OnCastComplete = func(sim *core.Simulation, cast *core.Cast) {
			druid.NaturesGrace = false
		}
	}
}

var WrathOfCenariusAuraID = core.NewAuraID()

func NewDruid(char core.Character, selfBuffs SelfBuffs, talents proto.DruidTalents) Druid {

	if talents.WrathOfCenarius > 0 {
		sfBonus := 0.04 * float64(talents.WrathOfCenarius)
		wrathBonus := 0.02 * float64(talents.WrathOfCenarius)
		char.AddPermanentAura(func(sim *core.Simulation) core.Aura {
			return core.Aura{
				ID:   WrathOfCenariusAuraID,
				Name: "Wrath of Cenarius Talent",
				OnBeforeSpellHit: func(sim *core.Simulation, spellCast *core.SpellCast, spellEffect *core.SpellEffect) {
					if spellCast.ActionID.SpellID == SpellIDSF8 || spellCast.ActionID.SpellID == SpellIDSF6 {
						spellEffect.BonusSpellPower += (spellCast.Character.GetStat(stats.SpellPower) + spellCast.Character.GetStat(stats.ArcaneSpellPower)) * sfBonus
					}
					if spellCast.ActionID.SpellID == SpellIDWrath {
						spellEffect.BonusSpellPower += (spellCast.Character.GetStat(stats.SpellPower) + spellCast.Character.GetStat(stats.NatureSpellPower)) * wrathBonus
					}
				},
			}
		})
	}

	char.AddStatDependency(stats.StatDependency{
		SourceStat:   stats.Intellect,
		ModifiedStat: stats.SpellCrit,
		Modifier: func(intellect float64, spellCrit float64) float64 {
			return spellCrit + (intellect/79.4)*core.SpellCritRatingPerCritChance
		},
	})

	if talents.LunarGuidance > 0 {
		bonus := 0.083 * float64(talents.LunarGuidance)
		char.AddStatDependency(stats.StatDependency{
			SourceStat:   stats.Intellect,
			ModifiedStat: stats.SpellPower,
			Modifier: func(intellect float64, spellPower float64) float64 {
				return spellPower + intellect*bonus
			},
		})
	}

	if talents.Dreamstate > 0 {
		bonus := 0.0333 * float64(talents.Dreamstate)
		char.AddStatDependency(stats.StatDependency{
			SourceStat:   stats.Intellect,
			ModifiedStat: stats.MP5,
			Modifier: func(intellect float64, mp5 float64) float64 {
				return mp5 + intellect*bonus
			},
		})
	}

	if talents.Intensity > 0 {
		char.PsuedoStats.SpiritRegenRateCasting = float64(talents.Intensity) * 0.1
	}

	return Druid{
		Character: char,
		SelfBuffs: selfBuffs,
		Talents:   talents,
		malorne4p: ItemSetMalorne.CharacterHasSetBonus(&char, 4),
	}
}

var FaerieFireDebuffID = core.NewDebuffID()

func init() {
	// TODO: get the actual real base stats here.
	core.BaseStats[core.BaseStatsKey{Race: proto.Race_RaceTauren, Class: proto.Class_ClassDruid}] = stats.Stats{
		stats.Strength:  103,
		stats.Agility:   61,
		stats.Stamina:   113,
		stats.Intellect: 109,
		stats.Spirit:    122,
		stats.Mana:      2678,
		stats.SpellCrit: 47.89,
	}
	core.BaseStats[core.BaseStatsKey{Race: proto.Race_RaceNightElf, Class: proto.Class_ClassDruid}] = stats.Stats{
		stats.Intellect: 104,
		stats.Mana:      2678,
		stats.Spirit:    135,
		stats.SpellCrit: 47.89,
	}
}

// Agent is a generic way to access underlying druid on any of the agents (for example balance druid.)
type Agent interface {
	GetDruid() *Druid
}
