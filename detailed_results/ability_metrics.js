import { ActionMetrics } from '/tbc/core/proto_utils/sim_result.js';
import { ActionId } from '/tbc/core/proto_utils/action_id.js';
import { ResultComponent } from './result_component.js';
export class AbilityMetrics extends ResultComponent {
    constructor(config) {
        super(config);
    }
    onSimResult(resultData) {
        const tableElem = this.rootElem.getElementsByClassName('metrics-table')[0];
        const bodyElem = this.rootElem.getElementsByClassName('metrics-table-body')[0];
        bodyElem.textContent = '';
        const players = resultData.result.getPlayers(resultData.filter);
        if (players.length != 1) {
            return;
        }
        const player = players[0];
        const addRow = (action, isChildMetric, rowNamePrefix, rowName) => {
            const fullName = rowNamePrefix ? rowNamePrefix + ' - ' + rowName : rowName;
            const rowElem = document.createElement('tr');
            if (isChildMetric) {
                rowElem.classList.add('child-metric');
            }
            bodyElem.appendChild(rowElem);
            const nameCellElem = document.createElement('td');
            rowElem.appendChild(nameCellElem);
            nameCellElem.innerHTML = `
			<a class="metrics-action-icon"></a>
			<span class="metrics-action-name">${fullName}</span>
			<span class="expand-toggle fa fa-caret-down"></span>
			<span class="expand-toggle fa fa-caret-right"></span>
			`;
            const iconElem = nameCellElem.getElementsByClassName('metrics-action-icon')[0];
            action.actionId.setBackgroundAndHref(iconElem);
            const addCell = (value) => {
                const cellElem = document.createElement('td');
                cellElem.textContent = String(value);
                rowElem.appendChild(cellElem);
                return cellElem;
            };
            this.addRowCells(action, addCell);
            return rowElem;
        };
        const addGroup = (actionGroup, namePrefix) => {
            if (actionGroup.length == 0) {
                return;
            }
            if (actionGroup.length == 1) {
                addRow(actionGroup[0], false, namePrefix, actionGroup[0].name);
                return;
            }
            // Sort by DPS because tablesorter doesn't let us apply sorting to child rows.
            actionGroup.sort((a, b) => b.dps - a.dps);
            const mergedMetrics = ActionMetrics.merge(actionGroup, true, namePrefix ? ActionId.fromPetName(namePrefix) : undefined);
            const parentRow = addRow(mergedMetrics, false, '', namePrefix || mergedMetrics.name);
            const childRows = actionGroup.map(meleeMetric => addRow(meleeMetric, true, namePrefix, meleeMetric.name));
            childRows.forEach(childRow => childRow.classList.add('child-metric'));
            const defaultDisplay = childRows[0].style.display;
            let expand = true;
            parentRow.classList.add('parent-metric', 'expand');
            parentRow.addEventListener('click', event => {
                expand = !expand;
                const newDisplayValue = expand ? defaultDisplay : 'none';
                childRows.forEach(row => row.style.display = newDisplayValue);
                if (expand) {
                    parentRow.classList.add('expand');
                }
                else {
                    parentRow.classList.remove('expand');
                }
            });
        };
        const actions = this.getPlayerActions(player);
        const actionGroups = ActionMetrics.groupById(actions);
        const petGroups = player.pets.map(pet => this.getPlayerActions(pet));
        if (actions.length == 0 && petGroups.every(group => group.length == 0)) {
            this.rootElem.classList.add('empty');
            return;
        }
        else {
            this.rootElem.classList.remove('empty');
        }
        actionGroups.forEach(meleeGroup => addGroup(meleeGroup, ''));
        player.pets.forEach((pet, i) => addGroup(petGroups[i], pet.name));
        $(tableElem).trigger('update');
    }
}
