import { Stat } from '/tbc/core/proto/common.js';
import { statNames } from '/tbc/core/proto_utils/names.js';
import { Stats } from '/tbc/core/proto_utils/stats.js';
import { TypedEvent } from '/tbc/core/typed_event.js';
import * as Mechanics from '/tbc/core/constants/mechanics.js';
import { Component } from './component.js';
const spellPowerTypeStats = [
    Stat.StatArcaneSpellPower,
    Stat.StatFireSpellPower,
    Stat.StatFrostSpellPower,
    Stat.StatHolySpellPower,
    Stat.StatNatureSpellPower,
    Stat.StatShadowSpellPower,
];
export class CharacterStats extends Component {
    constructor(parent, player, stats, modifyDisplayStats) {
        super(parent, 'character-stats-root');
        this.stats = stats;
        this.player = player;
        this.modifyDisplayStats = modifyDisplayStats;
        const table = document.createElement('table');
        table.classList.add('character-stats-table');
        this.rootElem.appendChild(table);
        this.valueElems = [];
        this.stats.forEach(stat => {
            const row = document.createElement('tr');
            row.classList.add('character-stats-table-row');
            table.appendChild(row);
            const label = document.createElement('td');
            label.classList.add('character-stats-table-label');
            label.textContent = statNames[stat].toUpperCase();
            row.appendChild(label);
            const value = document.createElement('td');
            value.classList.add('character-stats-table-value');
            row.appendChild(value);
            this.valueElems.push(value);
        });
        this.updateStats(new Stats(player.getCurrentStats().finalStats));
        TypedEvent.onAny([player.currentStatsEmitter, player.sim.changeEmitter]).on(() => {
            this.updateStats(new Stats(player.getCurrentStats().finalStats));
        });
    }
    updateStats(newStats) {
        if (this.modifyDisplayStats) {
            newStats = this.modifyDisplayStats(this.player, newStats);
        }
        this.stats.forEach((stat, idx) => {
            let rawValue = newStats.getStat(stat);
            if (spellPowerTypeStats.includes(stat)) {
                rawValue = rawValue + newStats.getStat(Stat.StatSpellPower);
            }
            let displayStr = String(Math.round(rawValue));
            if (stat == Stat.StatMeleeHit) {
                displayStr += ` (${(rawValue / Mechanics.MELEE_HIT_RATING_PER_HIT_CHANCE).toFixed(2)}%)`;
            }
            else if (stat == Stat.StatSpellHit) {
                displayStr += ` (${(rawValue / Mechanics.SPELL_HIT_RATING_PER_HIT_CHANCE).toFixed(2)}%)`;
            }
            else if (stat == Stat.StatMeleeCrit || stat == Stat.StatSpellCrit) {
                displayStr += ` (${(rawValue / Mechanics.SPELL_CRIT_RATING_PER_CRIT_CHANCE).toFixed(2)}%)`;
            }
            else if (stat == Stat.StatMeleeHaste || stat == Stat.StatSpellHaste) {
                displayStr += ` (${(rawValue / Mechanics.HASTE_RATING_PER_HASTE_PERCENT).toFixed(2)}%)`;
            }
            this.valueElems[idx].textContent = displayStr;
        });
    }
}
