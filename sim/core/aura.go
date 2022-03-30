package core

import (
	"math"
	"time"

	"github.com/wowsims/tbc/sim/core/proto"
	"github.com/wowsims/tbc/sim/core/stats"
)

const NeverExpires = time.Duration(math.MaxInt64)

type AuraID int32

// Reserve the default value so no aura uses it.
const UnknownAuraID = AuraID(0)

var numAuraIDs = 1

func NewAuraID() AuraID {
	newAuraID := AuraID(numAuraIDs)
	numAuraIDs++
	return newAuraID
}

// Reserve the default value so no aura uses it.
const UnknownDebuffID = AuraID(0)

var numDebuffIDs = 1

func NewDebuffID() AuraID {
	newDebuffID := AuraID(numDebuffIDs)
	numDebuffIDs++
	return newDebuffID
}

type CooldownID int32

// Reserve the default value so no cooldown uses it.
const UnknownCooldownID = AuraID(0)

var numCooldownIDs = 1

func NewCooldownID() CooldownID {
	newCooldownID := CooldownID(numCooldownIDs)
	numCooldownIDs++
	return newCooldownID
}

var GCDCooldownID = NewCooldownID()
var OffensiveTrinketSharedCooldownID = NewCooldownID()
var DefensiveTrinketSharedCooldownID = NewCooldownID()

type OnGain func(sim *Simulation)
type OnExpire func(sim *Simulation)

type Aura struct {
	ID       AuraID
	ActionID ActionID // If set, metrics will be tracked for this aura using this ID.

	Duration time.Duration // Duration of aura, upon being applied.

	startTime time.Duration // Time at which the aura was applied.
	expires   time.Duration // Time at which aura will be removed.

	activeIndex           int32 // Position of this aura's index in the activeAuraIDs array.
	onCastCompleteIndex   int32 // Position of this aura's index in the onCastCompleteIDs array.
	onSpellHitIndex       int32 // Position of this aura's index in the onSpellHitIDs array.
	onPeriodicDamageIndex int32 // Position of this aura's index in the onPeriodicDamageIDs array.

	// The number of stacks, or charges, of this aura. If this aura doesn't care
	// about charges, is just 0.
	Stacks int32

	// Invoked when a spell cast completes casting, before results are calculated.
	OnCastComplete OnCastComplete

	// Invoked when a spell hits, after results are calculated. Results can be modified by changing
	// properties of result.
	OnSpellHit OnSpellHit

	// Invoked when this Aura is added/remvoed. Neither is invoked on refresh.
	OnGain   OnGain
	OnExpire OnExpire

	// Invoked when a dot tick occurs, after damage is calculated.
	OnPeriodicDamage OnPeriodicDamage
}

func (aura *Aura) refresh(sim *Simulation) {
	if aura.Duration == NeverExpires {
		aura.expires = NeverExpires
	} else {
		aura.expires = sim.CurrentTime + aura.Duration
	}
}

type AuraFactory func(*Simulation) Aura

// Callback for doing something on reset.
type ResetEffect func(*Simulation)

// Wraps aura creation and calls it on every sim reset.
type PermanentAura struct {
	AuraFactory AuraFactory

	// By default, permanent auras have their expiration overwritten to never expire.
	// This option disables that behavior, creating an aura which is applies at the
	// beginning of every iteration but expires after a period of time. This is
	// used for some snapshotting effects like Warrior battle shout.
	RespectDuration bool

	// Multiplies uptime for the aura metrics of this aura. This is for buffs coded
	// as permanent but which are actually averaged versions of the real buff.
	UptimeMultiplier float64
}

// auraTracker is a centralized implementation of CD and Aura tracking.
//  This is currently used by Player and Raid (for global debuffs)
type auraTracker struct {
	// Effects to invoke on every sim reset.
	resetEffects []ResetEffect

	// Auras that never expire and should always be active.
	// These are automatically applied on each Sim reset.
	permanentAuras []PermanentAura

	// Callback to format aura-related logs.
	logFn func(string, ...interface{})

	// Set to true if this aura tracker is tracking target debuffs, instead of player buffs.
	useDebuffIDs bool

	// Whether finalize() has been called for this object.
	finalized bool

	// Maps MagicIDs to sim duration at which CD is done. Using array for perf.
	cooldowns []time.Duration

	// Maps MagicIDs to aura for that ID. Using array for perf.
	auras []Aura

	// IDs of Auras that are active, in no particular order.
	activeAuraIDs []AuraID

	// IDs of Auras that have a non-nil XXX function set.
	onCastCompleteIDs   []AuraID
	onSpellHitIDs       []AuraID
	onPeriodicDamageIDs []AuraID
	onMeleeAttackIDs    []AuraID

	aurasToAdd      []Aura
	auraIDsToRemove []AuraID

	// Metrics for each aura.
	metrics []AuraMetrics
}

func newAuraTracker(useDebuffIDs bool) auraTracker {
	numAura := numAuraIDs + 1 // TODO: this +1 shouldn't be needed, probably an aura ID created strangely somewhere.
	if useDebuffIDs {
		numAura = numDebuffIDs
	}
	return auraTracker{
		resetEffects:        []ResetEffect{},
		permanentAuras:      []PermanentAura{},
		activeAuraIDs:       make([]AuraID, 0, 16),
		onCastCompleteIDs:   make([]AuraID, 0, 16),
		onSpellHitIDs:       make([]AuraID, 0, 16),
		onPeriodicDamageIDs: make([]AuraID, 0, 16),
		onMeleeAttackIDs:    make([]AuraID, 0, 16),
		auras:               make([]Aura, numAura),
		cooldowns:           make([]time.Duration, numCooldownIDs),
		useDebuffIDs:        useDebuffIDs,
		metrics:             make([]AuraMetrics, numAura),
	}
}

// Registers a callback to this Character which will be invoked on
// every Sim reset.
func (at *auraTracker) RegisterResetEffect(resetEffect ResetEffect) {
	if at.finalized {
		panic("Reset effects may not be added once finalized!")
	}

	at.resetEffects = append(at.resetEffects, resetEffect)
}

// Registers a permanent aura to this Character which will be re-applied on
// every Sim reset.
func (at *auraTracker) AddPermanentAuraWithOptions(permAura PermanentAura) {
	if at.finalized {
		panic("Permanent auras may not be added once finalized!")
	}

	at.permanentAuras = append(at.permanentAuras, permAura)
}
func (at *auraTracker) AddPermanentAura(factory AuraFactory) {
	at.AddPermanentAuraWithOptions(PermanentAura{
		AuraFactory: factory,
	})
}

func (at *auraTracker) finalize() {
	if at.finalized {
		return
	}
	at.finalized = true
}

func (at *auraTracker) reset(sim *Simulation) {
	if at.useDebuffIDs {
		at.auras = make([]Aura, numDebuffIDs)
	} else {
		copy(at.auras, sim.emptyAuras)
	}

	at.cooldowns = make([]time.Duration, numCooldownIDs)
	at.activeAuraIDs = at.activeAuraIDs[:0]
	at.onCastCompleteIDs = at.onCastCompleteIDs[:0]
	at.onSpellHitIDs = at.onSpellHitIDs[:0]
	at.onPeriodicDamageIDs = at.onPeriodicDamageIDs[:0]
	at.onMeleeAttackIDs = at.onMeleeAttackIDs[:0]

	at.aurasToAdd = []Aura{}
	at.auraIDsToRemove = []AuraID{}

	for i, _ := range at.metrics {
		auraMetric := &at.metrics[i]
		auraMetric.reset()
	}

	for _, resetEffect := range at.resetEffects {
		resetEffect(sim)
	}

	for _, permAura := range at.permanentAuras {
		aura := permAura.AuraFactory(sim)
		if !permAura.RespectDuration {
			aura.Duration = NeverExpires
		}
		at.ReplaceAura(sim, aura)
		if permAura.UptimeMultiplier != 0 && !aura.ActionID.IsEmptyAction() {
			// We're going to add 100% uptime at the end, so subtract 1 now.
			at.AddAuraUptime(aura.ID, aura.ActionID, time.Duration(float64(sim.Duration)*(permAura.UptimeMultiplier-1)))
		}
	}
}

func (at *auraTracker) advance(sim *Simulation) {
	if len(at.auraIDsToRemove) > 0 {
		// Copy to temp array so there are no issues if RemoveAuraOnNextAdvance()
		// is called within the loop.
		toRemove := at.auraIDsToRemove
		at.auraIDsToRemove = []AuraID{}

		for _, id := range toRemove {
			at.RemoveAura(sim, id)
		}
	}

	if len(at.aurasToAdd) > 0 {
		// Copy to temp array so there are no issues if AddAuraOnNextAdvance()
		// is called within the loop.
		toAdd := at.aurasToAdd
		at.aurasToAdd = []Aura{}

		for _, aura := range toAdd {
			at.AddAura(sim, aura)
		}
	}

	for _, id := range at.activeAuraIDs {
		if aura := &at.auras[id]; aura.expires <= sim.CurrentTime {
			at.RemoveAura(sim, id)
		}
	}
}

func (at *auraTracker) doneIteration(simDuration time.Duration) {
	// Add metrics for any auras that are still active.
	for _, aura := range at.auras {
		if !aura.ActionID.IsEmptyAction() {
			at.AddAuraUptime(aura.ID, aura.ActionID, simDuration-aura.startTime)
		}
	}

	for i, _ := range at.metrics {
		auraMetric := &at.metrics[i]
		auraMetric.doneIteration()
	}
}

// ReplaceAura is like AddAura but an existing aura will not be removed/readded.
// This means that 'OnExpire' will not fire off on the old aura.
func (at *auraTracker) ReplaceAura(sim *Simulation, newAura Aura) {
	if !at.HasAura(newAura.ID) {
		at.AddAura(sim, newAura)
		return
	}

	old := at.auras[newAura.ID]

	// private cached state has to be copied over
	newAura.activeIndex = old.activeIndex
	newAura.onCastCompleteIndex = old.onCastCompleteIndex
	newAura.onSpellHitIndex = old.onSpellHitIndex
	newAura.onPeriodicDamageIndex = old.onPeriodicDamageIndex
	newAura.startTime = old.startTime
	newAura.refresh(sim)

	at.auras[newAura.ID] = newAura

	if sim.Log != nil && !at.auras[newAura.ID].ActionID.IsEmptyAction() {
		at.logFn("Aura refreshed: %s", at.auras[newAura.ID].ActionID)
	}
}

// Adds a new aura to the simulation. If an aura with the same ID already
// exists it will be replaced with the new one.
func (at *auraTracker) AddAura(sim *Simulation, newAura Aura) {
	if newAura.ID == 0 {
		panic("Empty aura ID")
	}

	if newAura.Duration == 0 {
		panic("Aura with 0 duration")
	}

	if aura := &at.auras[newAura.ID]; aura.ID != 0 {
		// Getting lots of bug reports, do a grep and catch all cases for this before uncommenting.
		//panic(fmt.Sprintf("AddAura(%v) at %s - previous has %s left, use ReplaceAura() instead", newAura.ActionID, sim.CurrentTime, aura.expires-sim.CurrentTime))
		at.RemoveAura(sim, newAura.ID)
	}

	newAura.startTime = sim.CurrentTime
	newAura.refresh(sim)

	if newAura.Duration != NeverExpires {
		newAura.startTime = sim.CurrentTime
		newAura.expires = sim.CurrentTime + newAura.Duration

		newAura.activeIndex = int32(len(at.activeAuraIDs))
		at.activeAuraIDs = append(at.activeAuraIDs, newAura.ID)
	}

	if newAura.OnCastComplete != nil {
		newAura.onCastCompleteIndex = int32(len(at.onCastCompleteIDs))
		at.onCastCompleteIDs = append(at.onCastCompleteIDs, newAura.ID)
	}

	if newAura.OnSpellHit != nil {
		newAura.onSpellHitIndex = int32(len(at.onSpellHitIDs))
		at.onSpellHitIDs = append(at.onSpellHitIDs, newAura.ID)
	}

	if newAura.OnPeriodicDamage != nil {
		newAura.onPeriodicDamageIndex = int32(len(at.onPeriodicDamageIDs))
		at.onPeriodicDamageIDs = append(at.onPeriodicDamageIDs, newAura.ID)
	}

	if sim.Log != nil && !newAura.ActionID.IsEmptyAction() {
		at.logFn("Aura gained: %s", newAura.ActionID)
	}

	at.auras[newAura.ID] = newAura

	if newAura.OnGain != nil {
		newAura.OnGain(sim)
	}
}

// Like AddAura but ensures that callbacks for this Aura will be invoked first.
func (at *auraTracker) AddPriorityAura(sim *Simulation, auraToAdd Aura) {
	at.AddAura(sim, auraToAdd)
	newAura := &at.auras[auraToAdd.ID]

	if newAura.OnCastComplete != nil {
		otherAuraID := at.onCastCompleteIDs[0]
		at.onCastCompleteIDs[0] = newAura.ID
		at.onCastCompleteIDs[len(at.onCastCompleteIDs)-1] = otherAuraID
		at.auras[otherAuraID].onCastCompleteIndex = newAura.onCastCompleteIndex
		newAura.onCastCompleteIndex = 0
	}

	if newAura.OnSpellHit != nil {
		otherAuraID := at.onSpellHitIDs[0]
		at.onSpellHitIDs[0] = newAura.ID
		at.onSpellHitIDs[len(at.onSpellHitIDs)-1] = otherAuraID
		at.auras[otherAuraID].onSpellHitIndex = newAura.onSpellHitIndex
		newAura.onSpellHitIndex = 0
	}

	if newAura.OnPeriodicDamage != nil {
		otherAuraID := at.onPeriodicDamageIDs[0]
		at.onPeriodicDamageIDs[0] = newAura.ID
		at.onPeriodicDamageIDs[len(at.onPeriodicDamageIDs)-1] = otherAuraID
		at.auras[otherAuraID].onPeriodicDamageIndex = newAura.onPeriodicDamageIndex
		newAura.onPeriodicDamageIndex = 0
	}
}

// Remove an aura by its ID
func (at *auraTracker) RemoveAura(sim *Simulation, id AuraID) {
	aura := &at.auras[id]

	if aura.ID == 0 {
		// rarely happens if advance() triggers actions that result in RemoveAura() calls
		return
	}

	if aura.OnExpire != nil {
		aura.OnExpire(sim)
	}

	if !aura.ActionID.IsEmptyAction() {
		if sim.CurrentTime > aura.expires {
			at.AddAuraUptime(id, aura.ActionID, aura.expires-aura.startTime)
		} else {
			at.AddAuraUptime(id, aura.ActionID, sim.CurrentTime-aura.startTime)
		}
	}

	if sim.Log != nil && !aura.ActionID.IsEmptyAction() {
		at.logFn("Aura faded: %s", aura.ActionID)
	}

	if aura.Duration != NeverExpires {
		removeActiveIndex := aura.activeIndex
		at.activeAuraIDs = removeBySwappingToBack(at.activeAuraIDs, removeActiveIndex)
		if removeActiveIndex < int32(len(at.activeAuraIDs)) {
			at.auras[at.activeAuraIDs[removeActiveIndex]].activeIndex = removeActiveIndex
		}
	}

	if aura.OnCastComplete != nil {
		removeOnCastCompleteIndex := aura.onCastCompleteIndex
		at.onCastCompleteIDs = removeBySwappingToBack(at.onCastCompleteIDs, removeOnCastCompleteIndex)
		if removeOnCastCompleteIndex < int32(len(at.onCastCompleteIDs)) {
			at.auras[at.onCastCompleteIDs[removeOnCastCompleteIndex]].onCastCompleteIndex = removeOnCastCompleteIndex
		}
	}

	if aura.OnSpellHit != nil {
		removeOnSpellHitIndex := aura.onSpellHitIndex
		at.onSpellHitIDs = removeBySwappingToBack(at.onSpellHitIDs, removeOnSpellHitIndex)
		if removeOnSpellHitIndex < int32(len(at.onSpellHitIDs)) {
			at.auras[at.onSpellHitIDs[removeOnSpellHitIndex]].onSpellHitIndex = removeOnSpellHitIndex
		}
	}

	if aura.OnPeriodicDamage != nil {
		removeOnPeriodicDamage := aura.onPeriodicDamageIndex
		at.onPeriodicDamageIDs = removeBySwappingToBack(at.onPeriodicDamageIDs, removeOnPeriodicDamage)
		if removeOnPeriodicDamage < int32(len(at.onPeriodicDamageIDs)) {
			at.auras[at.onPeriodicDamageIDs[removeOnPeriodicDamage]].onPeriodicDamageIndex = removeOnPeriodicDamage
		}
	}

	at.auras[id] = Aura{}
}

// Registers an ID to be added on the next advance() call. This is used instead
// of AddAura() when calling from inside a callback like OnSpellHit() to avoid
// modifying auraTracker arrays while they are being looped over.
func (at *auraTracker) AddAuraOnNextAdvance(sim *Simulation, aura Aura) {
	at.aurasToAdd = append(at.aurasToAdd, aura)
}

// Registers an ID to be removed on the next advance() call. This is used instead
// of RemoveAura() when calling from inside a callback like OnSpellHit() to avoid
// modifying auraTracker arrays while they are being looped over.
func (at *auraTracker) RemoveAuraOnNextAdvance(sim *Simulation, id AuraID) {
	at.auraIDsToRemove = append(at.auraIDsToRemove, id)
}

// Constant-time removal from slice by swapping with the last element before removing.
func removeBySwappingToBack(arr []AuraID, removeIdx int32) []AuraID {
	arr[removeIdx] = arr[len(arr)-1]
	return arr[:len(arr)-1]
}

// Returns whether an aura with the given ID is currently active.
func (at *auraTracker) HasAura(id AuraID) bool {
	return at.auras[id].ID != 0
}

func (at *auraTracker) NumStacks(id AuraID) int32 {
	if at.HasAura(id) {
		return at.auras[id].Stacks
	} else {
		return 0
	}
}

func (at *auraTracker) RefreshAura(sim *Simulation, id AuraID) {
	if aura := &at.auras[id]; aura.ID != 0 {
		aura.refresh(sim)
	}
}

func (at *auraTracker) UpdateExpires(id AuraID, newExpires time.Duration) {
	if aura := &at.auras[id]; aura.ID != 0 {
		aura.expires = newExpires
	}
}

func (at *auraTracker) RemainingAuraDuration(sim *Simulation, id AuraID) time.Duration {
	if at.HasAura(id) {
		expires := at.auras[id].expires
		if expires == NeverExpires {
			return NeverExpires
		} else {
			return expires - sim.CurrentTime
		}
	} else {
		return 0
	}
}

func (at *auraTracker) AuraExpiresAt(id AuraID) time.Duration {
	if at.HasAura(id) {
		return at.auras[id].expires
	} else {
		return 0
	}
}

func (at *auraTracker) IsOnCD(id CooldownID, currentTime time.Duration) bool {
	return at.cooldowns[id] > currentTime
}

func (at *auraTracker) CDReadyAt(id CooldownID) time.Duration {
	return at.cooldowns[id]
}

func (at *auraTracker) GetRemainingCD(id CooldownID, currentTime time.Duration) time.Duration {
	return MaxDuration(0, at.cooldowns[id]-currentTime)
}

func (at *auraTracker) SetCD(id CooldownID, newCD time.Duration) {
	if id == 0 {
		panic("Trying to set CD with ID 0!")
	}
	at.cooldowns[id] = newCD
}

// Invokes the OnCastComplete event for all tracked Auras.
func (at *auraTracker) OnCastComplete(sim *Simulation, cast *Cast) {
	for _, id := range at.onCastCompleteIDs {
		at.auras[id].OnCastComplete(sim, cast)
	}
}

// Invokes the OnSpellHit event for all tracked Auras.
func (at *auraTracker) OnSpellHit(sim *Simulation, spellCast *SpellCast, spellEffect *SpellEffect) {
	for _, id := range at.onSpellHitIDs {
		at.auras[id].OnSpellHit(sim, spellCast, spellEffect)
	}
}

// Invokes the OnPeriodicDamage
//   As a debuff when target is being hit by dot.
//   As a buff when caster's dots are ticking.
func (at *auraTracker) OnPeriodicDamage(sim *Simulation, spellCast *SpellCast, spellEffect *SpellEffect, tickDamage float64) {
	for _, id := range at.onPeriodicDamageIDs {
		at.auras[id].OnPeriodicDamage(sim, spellCast, spellEffect, tickDamage)
	}
}

func (at *auraTracker) AddAuraUptime(auraID AuraID, actionID ActionID, uptime time.Duration) {
	metrics := &at.metrics[auraID]

	metrics.ID = actionID
	metrics.Uptime += uptime
}

func (at *auraTracker) GetMetricsProto(numIterations int32) []*proto.AuraMetrics {
	metrics := make([]*proto.AuraMetrics, 0, len(at.metrics))

	for _, auraMetric := range at.metrics {
		if !auraMetric.ID.IsEmptyAction() {
			metrics = append(metrics, auraMetric.ToProto(numIterations))
		}
	}

	return metrics
}

// Stored value is the time at which the ICD will be off CD
type InternalCD time.Duration

func (icd InternalCD) IsOnCD(sim *Simulation) bool {
	return time.Duration(icd) > sim.CurrentTime
}

func (icd InternalCD) GetRemainingCD(sim *Simulation) time.Duration {
	return MaxDuration(0, time.Duration(icd)-sim.CurrentTime)
}

func NewICD() InternalCD {
	return InternalCD(0)
}

// NewTemporaryStatsAuraApplier creates an application function for applying temp stats.
//  This is higher performance because it creates a cached Aura object in its closure.
func (character *Character) NewTemporaryStatsAuraApplier(auraID AuraID, actionID ActionID, tempStats stats.Stats, duration time.Duration) func(sim *Simulation) {
	factory := character.NewTemporaryStatsAuraFactory(auraID, actionID, tempStats, duration)

	return func(sim *Simulation) {
		character.ReplaceAura(sim, factory(sim))
	}
}

func (character *Character) NewTemporaryStatsAuraFactory(auraID AuraID, actionID ActionID, tempStats stats.Stats, duration time.Duration) func(sim *Simulation) Aura {
	buffs := character.ApplyStatDependencies(tempStats)
	unbuffs := buffs.Multiply(-1)

	aura := Aura{
		ID:       auraID,
		ActionID: actionID,
		Duration: duration,
		OnGain: func(sim *Simulation) {
			character.AddStatsDynamic(sim, buffs)
			if sim.Log != nil {
				character.Log(sim, "Gained %s from %s.", buffs.FlatString(), actionID)
			}
		},
		OnExpire: func(sim *Simulation) {
			if sim.Log != nil {
				character.Log(sim, "Lost %s from fading %s.", buffs.FlatString(), actionID)
			}
			character.AddStatsDynamic(sim, unbuffs)
		},
	}

	return func(sim *Simulation) Aura {
		return aura
	}
}
