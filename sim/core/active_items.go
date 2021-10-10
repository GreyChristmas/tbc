package core

import (
	"fmt"
	"log"
	"time"

	"github.com/wowsims/tbc/sim/core/items"
)

// TODO: Find a better place for this.
const ItemIDTLC = 28785

// ItemActivation needs the state from simulator, party, and agent
//  because items can impact all 3. (potions, drums, JC necks, etc)
type ItemActivation func(*Simulation, Agent) Aura

type ActiveItem struct {
	Activate   ItemActivation `json:"-"` // Activatable Ability, produces an aura
	ActivateCD time.Duration  `json:"-"` // cooldown on activation
	CoolID     int32          `json:"-"` // ID used for cooldown
	SharedID   int32          `json:"-"` // ID used for shared item cooldowns (trinkets etc)
}

func AddActiveItem(id int32, ai ActiveItem) {
	_, ok := ActiveItemByID[id]
	if ok {
		log.Fatalf("Duplicate active item added: %d, %#v", id, ai)
	}
	ActiveItemByID[id] = ai
}

var ActiveItemByID = map[int32]ActiveItem{}

type ItemSet struct {
	Name    string
	Items   map[int32]struct{}     // map[key]struct{} is roughly a set in go.
	Bonuses map[int]ItemActivation // maps item count to activations
}

func (set ItemSet) ItemIsInSet(itemID int32) bool {
	_, ok := set.Items[itemID]
	return ok
}

func (set ItemSet) CharacterHasSetBonus(character *Character, numItems int) bool {
	if _, ok := set.Bonuses[numItems]; !ok {
		panic(fmt.Sprintf("Item set %s does not have a bonus with %d pieces.", set.Name, numItems))
	}

	count := 0
	for _, item := range character.Equip {
		if set.ItemIsInSet(item.ID) {
			count++
		}
	}

	return count >= numItems
}

var sets = []ItemSet{}

// cache for mapping item to set for fast resetting of sim.
var itemSetLookup = map[int32]*ItemSet{}

func AddItemSet(set ItemSet) {
	// TODO: validate the set doesnt exist already?

	setIdx := len(sets)
	sets = append(sets, set)
	for itemID := range set.Items {
		itemSetLookup[itemID] = &sets[setIdx]
	}
}

func init() {
	// pre-cache item to set lookup for faster sim resetting.
	for _, v := range items.Items {
		setFound := false
		for setIdx, set := range sets {
			if _, ok := set.Items[v.ID]; ok {
				itemSetLookup[v.ID] = &sets[setIdx]
				setFound = true
				break
			}
		}
		if !setFound {
			itemSetLookup[v.ID] = nil
		}
	}
}
