package mage

import (
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/proto"
)

func (mage *Mage) OnGCDReady(sim *core.Simulation) {
	mage.tryUseGCD(sim)
}

func (mage *Mage) OnManaTick(sim *core.Simulation) {
	if mage.FinishedWaitingForManaAndGCDReady(sim) {
		mage.tryUseGCD(sim)
	}
}

func (mage *Mage) tryUseGCD(sim *core.Simulation) {
	var spell *core.Spell
	if mage.RotationType == proto.Mage_Rotation_Arcane {
		spell = mage.doArcaneRotation(sim)
	} else if mage.RotationType == proto.Mage_Rotation_Fire {
		spell = mage.doFireRotation(sim)
	} else {
		spell = mage.doFrostRotation(sim)
	}

	if success := spell.Cast(sim, sim.GetPrimaryTarget()); success {
		return
	}

	if mage.numCastsDone != 0 {
		mage.tryingToDropStacks = false
	}

	numStacks := mage.NumStacks(ArcaneBlastAuraID)
	if numStacks > 0 && sim.GetRemainingDuration() > time.Second*5 {
		// Wait for AB stacks to drop.
		waitTime := mage.RemainingAuraDuration(sim, ArcaneBlastAuraID) + time.Millisecond*100
		if sim.Log != nil {
			mage.Log(sim, "Waiting for AB stacks to drop: %0.02f", waitTime.Seconds())
		}
		mage.Metrics.MarkOOM(&mage.Character, waitTime)
		mage.WaitUntil(sim, sim.CurrentTime+waitTime)
	} else {
		mage.WaitForMana(sim, spell.Instance.GetManaCost())
	}
}

func (mage *Mage) doArcaneRotation(sim *core.Simulation) *core.Spell {
	if mage.UseAoeRotation {
		return mage.doAoeRotation(sim)
	}

	// Only arcane rotation cares about mana tracking so update it here.
	// Don't need to update tracker because we only use certain functions.
	//mage.manaTracker.Update(sim, mage.GetCharacter())

	// Create an AB object because we use its mana cost / cast time in many of our calculations.
	numStacks := mage.NumStacks(ArcaneBlastAuraID)
	abCastTime := mage.ArcaneBlastCastTime(numStacks)
	abManaCost := mage.ArcaneBlastManaCost(numStacks)
	willDropStacks := mage.willDropArcaneBlastStacks(sim, abCastTime, numStacks)

	mage.isBlastSpamming = mage.canBlast(sim, abManaCost, abCastTime, numStacks, willDropStacks)
	if mage.isBlastSpamming {
		return mage.ArcaneBlast
	}

	currentManaPercent := mage.CurrentManaPercent()

	if mage.isDoingRegenRotation {
		// Check if we should stop regen rotation.
		if currentManaPercent > mage.ArcaneRotation.StopRegenRotationPercent && willDropStacks {
			mage.isDoingRegenRotation = false
			if mage.disabledMCDs != nil {
				mage.EnableAllCooldowns(mage.disabledMCDs)
				mage.disabledMCDs = nil
			}
		}
	} else {
		// Check if we should start regen rotation.
		startThreshold := mage.ArcaneRotation.StartRegenRotationPercent
		if mage.HasAura(core.BloodlustAuraID) {
			startThreshold = core.MinFloat(0.1, startThreshold)
		}

		if currentManaPercent < startThreshold {
			mage.isDoingRegenRotation = true
			mage.tryingToDropStacks = true
			mage.numCastsDone = 0

			if mage.ArcaneRotation.DisableDpsCooldownsDuringRegen {
				mage.disabledMCDs = mage.DisableAllEnabledCooldowns(core.CooldownTypeDPS)
			}
		}
	}

	if !mage.isDoingRegenRotation {
		return mage.ArcaneBlast
	}

	if mage.tryingToDropStacks {
		if willDropStacks {
			mage.tryingToDropStacks = false
			mage.numCastsDone = 1 // 1 to count the blast we're about to return
			return mage.ArcaneBlast
		} else {
			// Do a filler spell while waiting for stacks to drop.
			mage.numCastsDone++
			switch mage.ArcaneRotation.Filler {
			case proto.Mage_Rotation_ArcaneRotation_Frostbolt:
				return mage.Frostbolt
			case proto.Mage_Rotation_ArcaneRotation_ArcaneMissiles:
				return mage.ArcaneMissiles
			case proto.Mage_Rotation_ArcaneRotation_Scorch:
				return mage.Scorch
			case proto.Mage_Rotation_ArcaneRotation_Fireball:
				return mage.Fireball
			case proto.Mage_Rotation_ArcaneRotation_ArcaneMissilesFrostbolt:
				if mage.numCastsDone%2 == 1 {
					return mage.ArcaneMissiles
				} else {
					return mage.Frostbolt
				}
			case proto.Mage_Rotation_ArcaneRotation_ArcaneMissilesScorch:
				if mage.numCastsDone%2 == 1 {
					return mage.ArcaneMissiles
				} else {
					return mage.Scorch
				}
			case proto.Mage_Rotation_ArcaneRotation_ScorchTwoFireball:
				if mage.numCastsDone%3 == 1 {
					return mage.Scorch
				} else {
					return mage.Fireball
				}
			default:
				return mage.Frostbolt
			}
		}
	} else {
		mage.numCastsDone++
		if (mage.Metrics.WentOOM && currentManaPercent < 0.2 && mage.numCastsDone >= 2) || mage.numCastsDone >= mage.ArcaneRotation.ArcaneBlastsBetweenFillers {
			mage.tryingToDropStacks = true
			mage.numCastsDone = 0
		}
		return mage.ArcaneBlast
	}
}

func (mage *Mage) doFireRotation(sim *core.Simulation) *core.Spell {
	target := sim.GetPrimaryTarget()

	if mage.FireRotation.MaintainImprovedScorch && (target.NumStacks(core.ImprovedScorchDebuffID) < 5 || target.RemainingAuraDuration(sim, core.ImprovedScorchDebuffID) < time.Millisecond*5500) {
		return mage.Scorch
	}

	if mage.UseAoeRotation {
		return mage.doAoeRotation(sim)
	}

	if mage.FireRotation.WeaveFireBlast && !mage.IsOnCD(FireBlastCooldownID, sim.CurrentTime) {
		return mage.FireBlast
	}

	if mage.FireRotation.PrimarySpell == proto.Mage_Rotation_FireRotation_Fireball {
		return mage.Fireball
	} else {
		return mage.Scorch
	}
}

func (mage *Mage) doFrostRotation(sim *core.Simulation) *core.Spell {
	if mage.UseAoeRotation {
		return mage.doAoeRotation(sim)
	}

	return mage.Frostbolt
}

func (mage *Mage) doAoeRotation(sim *core.Simulation) *core.Spell {
	if mage.AoeRotation.Rotation == proto.Mage_Rotation_AoeRotation_ArcaneExplosion {
		return mage.ArcaneExplosion
	} else if mage.AoeRotation.Rotation == proto.Mage_Rotation_AoeRotation_Flamestrike {
		return mage.Flamestrike
	} else {
		return mage.Blizzard
	}
}
