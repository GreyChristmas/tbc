package rogue

import (
	"strconv"
	"time"

	"github.com/wowsims/tbc/sim/core"
)

var RuptureActionID = core.ActionID{SpellID: 26867}
var RuptureEnergyCost = 25.0

func (rogue *Rogue) registerRuptureSpell(sim *core.Simulation) {
	refundAmount := 0.4 * float64(rogue.Talents.QuickRecovery)
	ability := rogue.newAbility(RuptureActionID, RuptureEnergyCost, SpellFlagFinisher|core.SpellExtrasIgnoreResists, core.ProcMaskMeleeMHSpecial)

	rogue.Rupture = rogue.RegisterSpell(core.SpellConfig{
		Template: ability,
		ModifyCast: func(sim *core.Simulation, target *core.Target, instance *core.SimpleSpell) {
			instance.ActionID.Tag = rogue.ComboPoints()
			instance.Effect.Target = target
			if rogue.deathmantle4pcProc {
				instance.Cost.Value = 0
				rogue.deathmantle4pcProc = false
			}
		},
		ApplyEffects: core.ApplyEffectFuncDirectDamage(core.SpellEffect{
			ProcMask:         core.ProcMaskMeleeMHSpecial,
			DamageMultiplier: 1,
			ThreatMultiplier: 1,
			OutcomeApplier:   core.OutcomeFuncMeleeSpecialHit(),
			OnSpellHit: func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
				if spellEffect.Landed() {
					rogue.RuptureDot.NumberOfTicks = int(rogue.ComboPoints()) + 3
					rogue.RuptureDot.RecomputeAuraDuration()
					rogue.RuptureDot.Apply(sim)
					rogue.ApplyFinisher(sim, spell.ActionID)
				} else {
					if refundAmount > 0 {
						rogue.AddEnergy(sim, spell.MostRecentCost*refundAmount, core.ActionID{SpellID: 31245})
					}
				}
			},
		}),
	})

	target := sim.GetPrimaryTarget()
	rogue.RuptureDot = core.NewDot(core.Dot{
		Spell: rogue.Rupture,
		Aura: target.RegisterAura(&core.Aura{
			Label:    "Rupture-" + strconv.Itoa(int(rogue.Index)),
			ActionID: RuptureActionID,
		}),
		NumberOfTicks: 0, // Set dynamically
		TickLength:    time.Second * 2,
		TickEffects: core.TickFuncSnapshot(target, core.SpellEffect{
			DamageMultiplier: 1 + 0.1*float64(rogue.Talents.SerratedBlades),
			ThreatMultiplier: 1,
			IsPeriodic:       true,
			BaseDamage: core.BuildBaseDamageConfig(func(sim *core.Simulation, hitEffect *core.SpellEffect, spell *core.Spell) float64 {
				comboPoints := rogue.ComboPoints()
				attackPower := hitEffect.MeleeAttackPower(spell.Character) + hitEffect.MeleeAttackPowerOnTarget()

				return 70 + float64(comboPoints)*11 + attackPower*[]float64{0.01, 0.02, 0.03, 0.03, 0.03}[comboPoints-1]
			}, 0),
			OutcomeApplier: core.OutcomeFuncTick(),
		}),
	})
}

func (rogue *Rogue) RuptureDuration(comboPoints int32) time.Duration {
	return time.Second*6 + time.Second*2*time.Duration(comboPoints)
}
