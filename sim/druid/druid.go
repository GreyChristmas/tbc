package druid

import (
	"time"

	"github.com/wowsims/tbc/sim/core/proto"
	"github.com/wowsims/tbc/sim/core"
)

type Druid struct {
	core.Character
}

func (druid *Druid) GetCharacter() *core.Character {
	return &druid.Character
}

func (druid *Druid) AddRaidBuffs(raidBuffs *proto.RaidBuffs) {
	// TODO: Use talents to check for imp gotw
	raidBuffs.GiftOfTheWild = proto.TristateEffect_TristateEffectRegular
}
func (druid *Druid) AddPartyBuffs(partyBuffs *proto.PartyBuffs) {
	//buffs.Moonkin = proto.TristateEffect_TristateEffectRegular
	// check for idol of raven goddess equipped
}

func (druid *Druid) Reset(newsim *core.Simulation) {
}

func (druid *Druid) Act(sim *core.Simulation) time.Duration {
	return core.NeverExpires // makes the bot wait forever and do nothing.
}
