package priest

import (
	"strconv"
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/stats"
)

// https://web.archive.org/web/20071201221602/http://www.shadowpriest.com/viewtopic.php?t=7616

const SpellIDShadowfiend int32 = 34433

var ShadowfiendActionID = core.ActionID{SpellID: SpellIDShadowfiend}

func (priest *Priest) registerShadowfiendCD() {
	if !priest.UseShadowfiend {
		return
	}

	priest.AddMajorCooldown(core.MajorCooldown{
		ActionID: ShadowfiendActionID,
		Cooldown: core.Cooldown{
			Timer:    priest.NewTimer(),
			Duration: time.Minute * 5,
		},
		UsesGCD: true,
		Type:    core.CooldownTypeMana,
		CanActivate: func(sim *core.Simulation, character *core.Character) bool {
			if character.CurrentMana() < 575 {
				return false
			}

			return true
		},
		ShouldActivate: func(sim *core.Simulation, character *core.Character) bool {
			if character.CurrentManaPercent() >= 0.5 {
				return false
			}

			return true
		},
		ActivationFactory: func(sim *core.Simulation) core.CooldownActivation {
			return func(sim *core.Simulation, character *core.Character) {
				priest.Shadowfiend.Cast(sim, sim.GetPrimaryTarget())

				// All MCDs that use the GCD and have a non-zero cast time must call this.
				priest.UpdateMajorCooldowns()
			}
		},
	})
}

func (priest *Priest) registerShadowfiendSpell(sim *core.Simulation) {
	baseCost := priest.BaseMana() * 0.06
	shadowfiendMCD := priest.GetInitialMajorCooldown(ShadowfiendActionID)

	priest.Shadowfiend = priest.RegisterSpell(core.SpellConfig{
		ActionID:    ShadowfiendActionID,
		SpellSchool: core.SpellSchoolShadow,

		ResourceType: stats.Mana,
		BaseCost:     baseCost,

		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				Cost: baseCost * (1 - 0.02*float64(priest.Talents.MentalAgility)),
				GCD:  core.GCDDefault,
			},
			CD: shadowfiendMCD.Cooldown,
		},

		ApplyEffects: core.ApplyEffectFuncDirectDamage(core.SpellEffect{
			ProcMask:            core.ProcMaskEmpty,
			BonusSpellHitRating: float64(priest.Talents.ShadowFocus) * 2 * core.SpellHitRatingPerHitChance,
			OutcomeApplier:      core.OutcomeFuncMagicHit(),
			OnSpellHit: func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
				if spellEffect.Landed() {
					priest.ShadowfiendDot.Apply(sim)
				}
			},
		}),
	})

	// TODO: not sure if it matters but sfiend technically does melee attacks not periodic dot dmg.
	target := sim.GetPrimaryTarget()
	priest.ShadowfiendDot = core.NewDot(core.Dot{
		Spell: priest.Shadowfiend,
		Aura: target.RegisterAura(core.Aura{
			Label:    "Shadowfiend-" + strconv.Itoa(int(priest.Index)),
			ActionID: ShadowfiendActionID,
		}),

		// Dmg over 15 sec = shadow_dmg*.6 + 1191
		// just simulate 10 1.5s long ticks
		NumberOfTicks: 10 + core.TernaryInt(ItemSetIncarnate.CharacterHasSetBonus(&priest.Character, 2), 2, 0),
		TickLength:    time.Millisecond * 1500,

		TickEffects: core.TickFuncSnapshot(target, core.SpellEffect{
			DamageMultiplier: 1 *
				(1 + float64(priest.Talents.Darkness)*0.02) *
				core.TernaryFloat64(priest.Talents.Shadowform, 1.15, 1),
			IsPeriodic:     true,
			BaseDamage:     core.BaseDamageConfigMagicNoRoll(1191/10, 0.06),
			OutcomeApplier: core.OutcomeFuncTick(),
			OnPeriodicDamage: func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
				priest.AddMana(sim, spellEffect.Damage*2.5, ShadowfiendActionID, false)
			},
		}),
	})
}
