package dps

import (
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/proto"
	"github.com/wowsims/tbc/sim/warrior"
)

const DebuffRefreshWindow = time.Second * 2

func (war *DpsWarrior) OnGCDReady(sim *core.Simulation) {
	war.doRotation(sim)
}

func (war *DpsWarrior) OnAutoAttack(sim *core.Simulation, spell *core.Spell) {
	war.tryQueueSlam(sim)
	war.tryQueueHsCleave(sim)
}

func (war *DpsWarrior) doRotation(sim *core.Simulation) {
	if war.thunderClapNext {
		if war.CanThunderClap(sim) {
			war.ThunderClap.Cast(sim, sim.GetPrimaryTarget())
			if war.ThunderClapAura.RemainingDuration(sim) > DebuffRefreshWindow {
				war.thunderClapNext = false

				// Switching back to berserker immediately is unrealistic because the player needs
				// to visually confirm the TC landed. Instead we add a delay to model that.
				war.canSwapStanceAt = sim.CurrentTime + time.Millisecond*300
			}
			return
		}
	} else {
		war.trySwapToBerserker(sim)
	}

	if war.shouldSunder(sim) {
		war.castSlamAt = 0
		war.SunderArmor.Cast(sim, sim.GetPrimaryTarget())
		war.castFirstSunder = true
		war.tryQueueHsCleave(sim)
		return
	}

	isExecutePhase := sim.IsExecutePhase()
	canSlam := war.Rotation.UseSlam && !isExecutePhase || war.Rotation.UseSlamDuringExecute

	if war.castSlamAt != 0 {
		if sim.CurrentTime < war.castSlamAt {
			return
		} else if sim.CurrentTime == war.castSlamAt {
			war.castSlamAt = 0
			if war.CanSlam() {
				war.CastSlam(sim, sim.GetPrimaryTarget())
				war.tryQueueHsCleave(sim)
				return
			}
		} else {
			war.castSlamAt = 0
			return
		}
	}

	// If using a GCD will clip the next slam, only allow high priority spells like BT/MS/WW/debuffs.
	highPrioSpellsOnly := canSlam && sim.CurrentTime+core.GCDDefault-war.slamGCDDelay > war.AutoAttacks.MainhandSwingAt+war.slamLatency

	if isExecutePhase {
		war.executeRotation(sim, highPrioSpellsOnly)
	} else {
		war.normalRotation(sim, highPrioSpellsOnly)
	}

	if war.GCD.IsReady(sim) && !war.thunderClapNext {
		// We didn't cast anything, so wait for the next CD.
		// Note that BT/MS share a CD timer so we don't need to check MS.
		nextCD := core.MinDuration(war.Bloodthirst.CD.ReadyAt(), war.Whirlwind.CD.ReadyAt())
		if nextCD > sim.CurrentTime {
			if canSlam {
				war.WaitUntil(sim, core.MinDuration(nextCD, war.AutoAttacks.MainhandSwingAt))
			} else {
				war.WaitUntil(sim, nextCD)
			}
		}
	}
}

func (war *DpsWarrior) normalRotation(sim *core.Simulation, highPrioSpellsOnly bool) {
	if war.GCD.IsReady(sim) {
		if war.ShouldRampage(sim) {
			war.Rampage.Cast(sim, nil)
		} else if war.Rotation.PrioritizeWw && war.CanWhirlwind(sim) {
			war.Whirlwind.Cast(sim, sim.GetPrimaryTarget())
		} else if war.CanBloodthirst(sim) {
			war.Bloodthirst.Cast(sim, sim.GetPrimaryTarget())
		} else if war.CanMortalStrike(sim) {
			war.MortalStrike.Cast(sim, sim.GetPrimaryTarget())
		} else if !war.Rotation.PrioritizeWw && war.CanWhirlwind(sim) {
			war.Whirlwind.Cast(sim, sim.GetPrimaryTarget())
		} else if !highPrioSpellsOnly {
			if war.tryMaintainDebuffs(sim) {
				// Do nothing, already cast
			} else if war.Rotation.UseOverpower && war.CurrentRage() < war.Rotation.OverpowerRageThreshold && war.ShouldOverpower(sim) {
				if !war.StanceMatches(warrior.BattleStance) {
					if !war.BattleStance.IsReady(sim) {
						return
					}
					war.BattleStance.Cast(sim, nil)
				}
				war.Overpower.Cast(sim, sim.GetPrimaryTarget())
			} else if war.ShouldBerserkerRage(sim) {
				war.BerserkerRage.Cast(sim, nil)
			} else if war.Rotation.UseHamstring && war.CurrentRage() >= war.Rotation.HamstringRageThreshold && war.ShouldHamstring(sim) {
				war.Hamstring.Cast(sim, sim.GetPrimaryTarget())
			}
		}
	}

	war.tryQueueHsCleave(sim)
}

func (war *DpsWarrior) executeRotation(sim *core.Simulation, highPrioSpellsOnly bool) {
	if war.GCD.IsReady(sim) {
		if war.ShouldRampage(sim) {
			war.Rampage.Cast(sim, nil)
		} else if war.Rotation.PrioritizeWw && war.Rotation.UseWwDuringExecute && war.CanWhirlwind(sim) {
			war.Whirlwind.Cast(sim, sim.GetPrimaryTarget())
		} else if war.Rotation.UseBtDuringExecute && war.CanBloodthirst(sim) {
			war.Bloodthirst.Cast(sim, sim.GetPrimaryTarget())
		} else if war.Rotation.UseMsDuringExecute && war.CanMortalStrike(sim) {
			war.MortalStrike.Cast(sim, sim.GetPrimaryTarget())
		} else if !war.Rotation.PrioritizeWw && war.Rotation.UseWwDuringExecute && war.CanWhirlwind(sim) {
			war.Whirlwind.Cast(sim, sim.GetPrimaryTarget())
		} else if !highPrioSpellsOnly {
			if war.tryMaintainDebuffs(sim) {
				// Do nothing, already cast
			} else if war.CanExecute() {
				war.Execute.Cast(sim, sim.GetPrimaryTarget())
			} else if war.ShouldBerserkerRage(sim) {
				war.BerserkerRage.Cast(sim, nil)
			}
		}
	}

	if war.Rotation.UseHsDuringExecute {
		war.tryQueueHsCleave(sim)
	}
}

func (war *DpsWarrior) shouldSunder(sim *core.Simulation) bool {
	if war.Rotation.SunderArmor == proto.Warrior_Rotation_SunderArmorOnce && !war.castFirstSunder && war.CanSunderArmor(sim) {
		return true
	} else if war.Rotation.SunderArmor == proto.Warrior_Rotation_SunderArmorMaintain &&
		war.CanSunderArmor(sim) &&
		(war.SunderArmorAura.GetStacks() < 5 || war.SunderArmorAura.RemainingDuration(sim) < time.Second*3) {
		return true
	}
	return false
}

func (war *DpsWarrior) slamInRotation(sim *core.Simulation) bool {
	return war.Rotation.UseSlam && (!sim.IsExecutePhase() || war.Rotation.UseSlamDuringExecute)
}

func (war *DpsWarrior) tryQueueSlam(sim *core.Simulation) {
	if !war.slamInRotation(sim) {
		return
	}

	if war.castSlamAt != 0 {
		// Slam already queued.
		return
	}

	// Check that we just finished a MH swing or a MH swing replacement.
	if war.AutoAttacks.MainhandSwingAt > sim.CurrentTime && war.AutoAttacks.MainhandSwingAt != sim.CurrentTime+war.AutoAttacks.MainhandSwingSpeed() {
		return
	}

	if war.thunderClapNext || !war.CanSlam() || war.shouldSunder(sim) {
		return
	}

	gcdAt := war.GCD.ReadyAt()
	slamAt := sim.CurrentTime + war.slamLatency
	if slamAt < gcdAt {
		if gcdAt-slamAt <= war.slamGCDDelay {
			slamAt = gcdAt
		} else {
			// We would have to wait too long for the GCD in order to slam, so don't use it.
			return
		}
	}

	gcdReadyAgainAt := slamAt + core.GCDDefault
	msDelay := core.MaxDuration(0, gcdReadyAgainAt-core.MaxDuration(sim.CurrentTime, war.MortalStrike.ReadyAt()))
	wwDelay := core.MaxDuration(0, gcdReadyAgainAt-core.MaxDuration(sim.CurrentTime, war.Whirlwind.ReadyAt()))
	if sim.IsExecutePhase() {
		if !war.Rotation.UseMsDuringExecute {
			msDelay = 0
		}
		if !war.Rotation.UseWwDuringExecute {
			wwDelay = 0
		}
	}

	if msDelay+wwDelay > war.slamMSWWDelay {
		return
	}

	war.castSlamAt = slamAt
	if slamAt != gcdAt {
		war.WaitUntil(sim, slamAt) // Pause GCD until slam time
	}
}

func (war *DpsWarrior) trySwapToBerserker(sim *core.Simulation) bool {
	if !war.StanceMatches(warrior.BerserkerStance) && war.BerserkerStance.IsReady(sim) && sim.CurrentTime >= war.canSwapStanceAt {
		war.BerserkerStance.Cast(sim, nil)
		return true
	}
	return false
}

// Returns whether any ability was cast.
func (war *DpsWarrior) tryMaintainDebuffs(sim *core.Simulation) bool {
	if war.ShouldShout(sim) {
		war.Shout.Cast(sim, nil)
		return true
	} else if war.Rotation.MaintainDemoShout && war.DemoralizingShoutAura.RemainingDuration(sim) < DebuffRefreshWindow && war.CanDemoralizingShout(sim) {
		war.DemoralizingShout.Cast(sim, sim.GetPrimaryTarget())
		return true
	} else if war.Rotation.MaintainThunderClap && war.ThunderClapAura.RemainingDuration(sim) < DebuffRefreshWindow && war.CanThunderClapIgnoreStance(sim) {
		war.thunderClapNext = true
		if !war.StanceMatches(warrior.BattleStance) {
			if !war.BattleStance.IsReady(sim) {
				return false
			}
			war.BattleStance.Cast(sim, nil)
		}
		// Need to check again because we might have lost rage from switching stances.
		if war.CanThunderClap(sim) {
			war.ThunderClap.Cast(sim, sim.GetPrimaryTarget())
			if war.ThunderClapAura.RemainingDuration(sim) > DebuffRefreshWindow {
				war.thunderClapNext = false
			}
		}
		return true
	}
	return false
}

func (war *DpsWarrior) tryQueueHsCleave(sim *core.Simulation) {
	if war.ShouldQueueHSOrCleave(sim) {
		war.QueueHSOrCleave(sim)
	}
}
