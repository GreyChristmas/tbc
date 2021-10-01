import { Stat } from '../api/common.js';
import { statNames } from '../api/names.js';
import { Stats } from '../api/stats.js';
import { Component } from './component.js';
export class CharacterStats extends Component {
    constructor(parent, stats, sim) {
        super(parent, 'character-stats-root');
        this.stats = stats;
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
            label.textContent = statNames[stat];
            row.appendChild(label);
            const value = document.createElement('td');
            value.classList.add('character-stats-table-value');
            row.appendChild(value);
            this.valueElems.push(value);
        });
        this.updateStats(new Stats());
        sim.characterStatsEmitter.on(() => {
            this.updateStats(new Stats(sim.getCurrentStats().finalStats));
        });
    }
    updateStats(newStats) {
        this.stats.forEach((stat, idx) => {
            const rawValue = newStats.getStat(stat);
            let displayStr = String(Math.round(rawValue));
            if (stat == Stat.StatMeleeHit) {
                displayStr += ` (${(rawValue / 15.8).toFixed(2)}%)`;
            }
            else if (stat == Stat.StatSpellHit) {
                displayStr += ` (${(rawValue / 12.6).toFixed(2)}%)`;
            }
            else if (stat == Stat.StatMeleeCrit || stat == Stat.StatSpellCrit) {
                displayStr += ` (${(rawValue / 22.08).toFixed(2)}%)`;
            }
            else if (stat == Stat.StatMeleeHaste || stat == Stat.StatSpellHaste) {
                displayStr += ` (${(rawValue / 15.76).toFixed(2)}%)`;
            }
            this.valueElems[idx].textContent = displayStr;
        });
    }
}