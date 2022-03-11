package paladin

import (
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/stats"
)

const TwistWindow = time.Millisecond * 400

var SealOfBloodAuraID = core.NewAuraID()
var SealOfBloodCastActionID = core.ActionID{SpellID: 31892}
var SealOfBloodProcActionID = core.ActionID{SpellID: 31893}

// Handles the cast, gcd, deducts the mana cost
func (paladin *Paladin) setupSealOfBlood() {
	// The proc behaviour
	sobProc := core.SimpleSpell{
		SpellCast: core.SpellCast{
			Cast: core.Cast{
				ActionID:            SealOfBloodProcActionID,
				Character:           &paladin.Character,
				OutcomeRollCategory: core.OutcomeRollCategorySpecial,
				CritRollCategory:    core.CritRollCategoryPhysical,
				SpellSchool:         core.SpellSchoolHoly,
				CritMultiplier:      paladin.DefaultMeleeCritMultiplier(),
				IsPhantom:           true,
			},
		},
		Effect: core.SpellHitEffect{
			SpellEffect: core.SpellEffect{
				DamageMultiplier:       1,
				StaticDamageMultiplier: 1,
				ThreatMultiplier:       1,
			},
			WeaponInput: core.WeaponDamageInput{
				DamageMultiplier: 0.35, // should deal 35% weapon deamage
			},
		},
	}

	sobTemplate := core.NewSimpleSpellTemplate(sobProc)
	sobAtk := core.SimpleSpell{}

	// Define the aura
	sobAura := core.Aura{
		ID:       SealOfBloodAuraID,
		ActionID: SealOfBloodProcActionID,

		OnSpellHit: func(sim *core.Simulation, spellCast *core.SpellCast, spellEffect *core.SpellEffect) {
			if !spellEffect.Landed() || !spellEffect.ProcMask.Matches(core.ProcMaskMelee) || spellCast.IsPhantom {
				return
			}

			sobTemplate.Apply(&sobAtk)
			sobAtk.Effect.Target = spellEffect.Target
			sobAtk.Cast(sim)
		},
	}

	manaCost := 210 * (1 - 0.03*float64(paladin.Talents.Benediction))
	sob := core.SimpleCast{
		Cast: core.Cast{
			ActionID:  SealOfBloodCastActionID,
			Character: paladin.GetCharacter(),
			BaseCost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			Cost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			GCD: core.GCDDefault,
		},
		OnCastComplete: func(sim *core.Simulation, cast *core.Cast) {
			paladin.UpdateSeal(sim, sobAura)
		},
	}

	paladin.sealOfBlood = sob
}

func (paladin *Paladin) NewSealOfBlood(sim *core.Simulation) *core.SimpleCast {
	sob := &paladin.sealOfBlood
	sob.Init(sim)
	return sob
}

var SealOfCommandAuraID = core.NewAuraID()
var SealOfCommandCastActionID = core.ActionID{SpellID: 20375}
var SealOfCommandProcActionID = core.ActionID{SpellID: 20424}

func (paladin *Paladin) setupSealOfCommand() {
	socProc := core.SimpleSpell{
		SpellCast: core.SpellCast{
			Cast: core.Cast{
				ActionID:            SealOfCommandProcActionID,
				Character:           &paladin.Character,
				OutcomeRollCategory: core.OutcomeRollCategorySpecial,
				CritRollCategory:    core.CritRollCategoryPhysical,
				SpellSchool:         core.SpellSchoolHoly,
				CritMultiplier:      paladin.DefaultMeleeCritMultiplier(),
			},
		},
		Effect: core.SpellHitEffect{
			SpellEffect: core.SpellEffect{
				DamageMultiplier:       1,
				StaticDamageMultiplier: 1,
				ThreatMultiplier:       1,
			},
			WeaponInput: core.WeaponDamageInput{
				DamageMultiplier: 0.70, // should deal 70% weapon deamage
			},
			DirectInput: core.DirectDamageInput{
				MaxBaseDamage:    0.1, // just so that the damage system thinks there is direct damage
				MinBaseDamage:    0.1,
				SpellCoefficient: 0.29,
			},
		},
	}

	socTemplate := core.NewSimpleSpellTemplate(socProc)
	socAtk := core.SimpleSpell{}

	ppmm := paladin.AutoAttacks.NewPPMManager(7.0)

	// I might not be implementing the ICD correctly here, should debug later
	var icd core.InternalCD
	const icdDur = time.Second * 1

	socAura := core.Aura{
		ID:       SealOfCommandAuraID,
		ActionID: SealOfCommandProcActionID,

		OnSpellHit: func(sim *core.Simulation, spellCast *core.SpellCast, spellEffect *core.SpellEffect) {
			if !spellEffect.Landed() || !spellEffect.ProcMask.Matches(core.ProcMaskMelee) || spellCast.IsPhantom {
				return
			}

			if icd.IsOnCD(sim) {
				return
			}

			if !ppmm.Proc(sim, true, false, "seal of command") {
				return
			}

			icd = core.InternalCD(sim.CurrentTime + icdDur)

			socTemplate.Apply(&socAtk)
			socAtk.Effect.Target = spellEffect.Target
			socAtk.Cast(sim)
		},
	}

	manaCost := 65 * (1 - 0.03*float64(paladin.Talents.Benediction))
	soc := core.SimpleCast{
		Cast: core.Cast{
			ActionID:  SealOfCommandCastActionID,
			Character: paladin.GetCharacter(),
			BaseCost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			Cost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			GCD: core.GCDDefault,
		},
		OnCastComplete: func(sim *core.Simulation, cast *core.Cast) {
			paladin.UpdateSeal(sim, socAura)
		},
	}

	paladin.sealOfCommand = soc
	paladin.SealOfCommandAura = socAura
}

func (paladin *Paladin) NewSealOfCommand(sim *core.Simulation) *core.SimpleCast {
	soc := &paladin.sealOfCommand
	soc.Init(sim)
	return soc
}

var SealOfTheCrusaderAuraID = core.NewAuraID()
var SealOfTheCrusaderActionID = core.ActionID{SpellID: 27158}

// Seal of the crusader has a bunch of effects that we realistically don't care about (bonus AP, faster swing speed)
// For now, we'll just use it as a setup to casting Judgement of the Crusader
func (paladin *Paladin) setupSealOfTheCrusader() {
	sotcAura := core.Aura{
		ID:       SealOfTheCrusaderAuraID,
		ActionID: SealOfTheCrusaderActionID,
	}

	manaCost := 210 * (1 - 0.03*float64(paladin.Talents.Benediction))
	sotc := core.SimpleCast{
		Cast: core.Cast{
			ActionID:  SealOfTheCrusaderActionID,
			Character: paladin.GetCharacter(),
			BaseCost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			Cost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			GCD: core.GCDDefault,
		},
		OnCastComplete: func(sim *core.Simulation, cast *core.Cast) {
			paladin.UpdateSeal(sim, sotcAura)
		},
	}

	paladin.sealOfTheCrusader = sotc
	paladin.SealOfTheCrusaderAura = sotcAura
}

func (paladin *Paladin) NewSealOfTheCrusader(sim *core.Simulation) *core.SimpleCast {
	sotc := &paladin.sealOfTheCrusader
	sotc.Init(sim)
	return sotc
}

// Didn't encode all the functionality of seal of wisdom
// For now, we'll just use it as a setup to casting Judgement of Wisdom
var SealOfWisdomAuraID = core.NewAuraID()
var SealOfWisdomActionID = core.ActionID{SpellID: 27166}

func (paladin *Paladin) setupSealOfWisdom() {
	sowAura := core.Aura{
		ID:       SealOfWisdomAuraID,
		ActionID: SealOfWisdomActionID,
	}

	manaCost := 270 * (1 - 0.03*float64(paladin.Talents.Benediction))
	sow := core.SimpleCast{
		Cast: core.Cast{
			ActionID:  SealOfWisdomActionID,
			Character: paladin.GetCharacter(),
			BaseCost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			Cost: core.ResourceCost{
				Type:  stats.Mana,
				Value: manaCost,
			},
			GCD: core.GCDDefault,
		},
		OnCastComplete: func(sim *core.Simulation, cast *core.Cast) {
			paladin.UpdateSeal(sim, sowAura)
		},
	}

	paladin.sealOfWisdom = sow
	paladin.SealOfWisdomAura = sowAura
}

func (paladin *Paladin) NewSealOfWisdom(sim *core.Simulation) *core.SimpleCast {
	sow := &paladin.sealOfWisdom
	sow.Init(sim)
	return sow
}

func (paladin *Paladin) UpdateSeal(sim *core.Simulation, newSeal core.Aura) {
	oldSeal := paladin.currentSeal
	newSeal.Expires = sim.CurrentTime + time.Second*30

	// Check if oldSeal has expired. If it already expired, we don't need to handle removal logic
	if oldSeal.Expires > sim.CurrentTime {
		// For Seal of Command, reduce duration to 0.4 seconds
		if oldSeal.ID == SealOfCommandAuraID {
			// Technically the current expiration could be shorter than 0.4 seconds
			// TO-DO: Lookup behavior when seal of command is twisted at shorter than 0.4 seconds duration
			oldSeal.Expires = sim.CurrentTime + TwistWindow
			paladin.ReplaceAura(sim, oldSeal)

			// This is a hack to get the sim to process and log the SoC aura expiring at the right time
			if sim.Options.Iterations == 1 {
				sim.AddPendingAction(&core.PendingAction{
					NextActionAt: sim.CurrentTime + TwistWindow,
					OnAction:     func(_ *core.Simulation) {},
				})
			}
		} else {
			paladin.RemoveAura(sim, oldSeal.ID)
		}
	}

	paladin.currentSeal = newSeal
	paladin.AddAura(sim, newSeal)
}
