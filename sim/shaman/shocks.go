package shaman

import (
	"strconv"
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/items"
	"github.com/wowsims/tbc/sim/core/stats"
)

const SpellIDEarthShock int32 = 25454
const SpellIDFlameShock int32 = 25457
const SpellIDFrostShock int32 = 25464

func (shaman *Shaman) ShockCD() time.Duration {
	return time.Second*6 - time.Millisecond*200*time.Duration(shaman.Talents.Reverberation)
}

// Shared logic for all shocks.
func (shaman *Shaman) newShockSpellConfig(sim *core.Simulation, spellID int32, spellSchool core.SpellSchool, baseCost float64, shockTimer *core.Timer) (core.SpellConfig, core.SpellEffect) {
	actionID := core.ActionID{SpellID: spellID}

	return core.SpellConfig{
			ActionID:    actionID,
			SpellSchool: spellSchool,
			SpellExtras: SpellFlagShock,

			ResourceType: stats.Mana,
			BaseCost:     baseCost,

			Cast: core.CastConfig{
				DefaultCast: core.Cast{
					Cost: baseCost -
						baseCost*float64(shaman.Talents.Convection)*0.02 -
						baseCost*float64(shaman.Talents.MentalQuickness)*0.02 -
						core.TernaryFloat64(ItemSetSkyshatterHarness.CharacterHasSetBonus(&shaman.Character, 2), baseCost*0.1, 0),
					GCD: core.GCDDefault,
				},
				ModifyCast: func(_ *core.Simulation, spell *core.Spell, cast *core.Cast) {
					shaman.modifyCastClearcasting(spell, cast)
					if shaman.ShamanisticFocusAura != nil && shaman.ShamanisticFocusAura.IsActive() {
						cast.Cost -= baseCost * 0.6
					}
					if shaman.ElementalMasteryAura != nil && shaman.ElementalMasteryAura.IsActive() {
						cast.Cost = 0
					}
				},
				CD: core.Cooldown{
					Timer:    shockTimer,
					Duration: shaman.ShockCD(),
				},
			},
		}, core.SpellEffect{
			ProcMask:            core.ProcMaskSpellDamage,
			BonusSpellHitRating: float64(shaman.Talents.ElementalPrecision) * 2 * core.SpellHitRatingPerHitChance,
			BonusSpellPower: 0 +
				core.TernaryFloat64(shaman.Equip[items.ItemSlotRanged].ID == TotemOfRage, 30, 0) +
				core.TernaryFloat64(shaman.Equip[items.ItemSlotRanged].ID == TotemOfImpact, 46, 0),
			DamageMultiplier: 1 * (1 + 0.01*float64(shaman.Talents.Concussion)),
			ThreatMultiplier: 1 - (0.1/3)*float64(shaman.Talents.ElementalPrecision),
		}
}

func (shaman *Shaman) registerEarthShockSpell(sim *core.Simulation, shockTimer *core.Timer) {
	config, effect := shaman.newShockSpellConfig(sim, SpellIDEarthShock, core.SpellSchoolNature, 535.0, shockTimer)
	config.SpellExtras |= core.SpellExtrasBinary

	effect.BaseDamage = core.BaseDamageConfigMagic(661, 696, 0.386)
	effect.OutcomeApplier = core.OutcomeFuncMagicHitAndCrit(shaman.ElementalCritMultiplier())
	config.ApplyEffects = core.ApplyEffectFuncDirectDamage(effect)

	shaman.EarthShock = shaman.RegisterSpell(config)
}

func (shaman *Shaman) registerFlameShockSpell(sim *core.Simulation, shockTimer *core.Timer) {
	config, effect := shaman.newShockSpellConfig(sim, SpellIDFlameShock, core.SpellSchoolFire, 500.0, shockTimer)

	effect.BaseDamage = core.BaseDamageConfigMagic(377, 377, 0.214)
	effect.OutcomeApplier = core.OutcomeFuncMagicHitAndCrit(shaman.ElementalCritMultiplier())
	if effect.OnSpellHit == nil {
		effect.OnSpellHit = func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
			if spellEffect.Landed() {
				shaman.FlameShockDot.Apply(sim)
			}
		}
	} else {
		oldSpellHit := effect.OnSpellHit
		effect.OnSpellHit = func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
			oldSpellHit(sim, spell, spellEffect)
			if spellEffect.Landed() {
				shaman.FlameShockDot.Apply(sim)
			}
		}
	}

	config.ApplyEffects = core.ApplyEffectFuncDirectDamage(effect)
	shaman.FlameShock = shaman.RegisterSpell(config)

	target := sim.GetPrimaryTarget()
	shaman.FlameShockDot = core.NewDot(core.Dot{
		Spell: shaman.FlameShock,
		Aura: target.RegisterAura(core.Aura{
			Label:    "FlameShock-" + strconv.Itoa(int(shaman.Index)),
			ActionID: core.ActionID{SpellID: SpellIDFlameShock},
		}),
		NumberOfTicks: 4,
		TickLength:    time.Second * 3,
		TickEffects: core.TickFuncSnapshot(target, core.SpellEffect{
			DamageMultiplier: 1 * (1 + 0.01*float64(shaman.Talents.Concussion)),
			ThreatMultiplier: 1,
			BaseDamage:       core.BaseDamageConfigMagicNoRoll(420/4, 0.1),
			OutcomeApplier:   core.OutcomeFuncTick(),
			IsPeriodic:       true,
			ProcMask:         core.ProcMaskPeriodicDamage,
		}),
	})
}

func (shaman *Shaman) registerFrostShockSpell(sim *core.Simulation, shockTimer *core.Timer) {
	config, effect := shaman.newShockSpellConfig(sim, SpellIDFrostShock, core.SpellSchoolFrost, 525.0, shockTimer)
	config.SpellExtras |= core.SpellExtrasBinary

	effect.ThreatMultiplier *= 2
	effect.BaseDamage = core.BaseDamageConfigMagic(647, 683, 0.386)
	effect.OutcomeApplier = core.OutcomeFuncMagicHitAndCrit(shaman.ElementalCritMultiplier())
	config.ApplyEffects = core.ApplyEffectFuncDirectDamage(effect)

	shaman.FrostShock = shaman.RegisterSpell(config)
}

func (shaman *Shaman) registerShocks(sim *core.Simulation) {
	shockTimer := shaman.NewTimer()
	shaman.registerEarthShockSpell(sim, shockTimer)
	shaman.registerFlameShockSpell(sim, shockTimer)
	shaman.registerFrostShockSpell(sim, shockTimer)
}
