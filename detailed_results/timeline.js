import { bucket, distinct, maxIndex, stringComparator } from '/tbc/core/utils.js';
import { actionColors } from './color_settings.js';
import { ResultComponent } from './result_component.js';
const dpsColor = '#ed5653';
const manaColor = '#2E93fA';
export class Timeline extends ResultComponent {
    constructor(config) {
        config.rootCssClass = 'timeline-root';
        super(config);
        this.resultData = null;
        this.rendered = false;
        this.rootElem.innerHTML = `
		<div class="timeline-disclaimer">
			<span class="timeline-warning fa fa-exclamation-triangle"></span>
			<span class="timeline-warning-description">Timeline data visualizes only 1 sim iteration.</span>
			<div class="timeline-run-again-button sim-button">SIM 1 ITERATION</div>
			<select class="timeline-chart-picker">
				<option value="dps">DPS</option>
				<option value="rotation">Rotation</option>
			</select>
		</div>
		<div class="timeline-plots-container">
			<div class="timeline-plot dps-resources-plot"></div>
			<div class="timeline-plot rotation-plot hide">
				<div class="rotation-container">
					<div class="rotation-labels">
					</div>
					<div class="rotation-timeline">
					</div>
				</div>
			</div>
		</div>
		`;
        const runAgainButton = this.rootElem.getElementsByClassName('timeline-run-again-button')[0];
        runAgainButton.addEventListener('click', event => {
            (window.opener || window.parent).postMessage('runOnce', '*');
        });
        const chartPicker = this.rootElem.getElementsByClassName('timeline-chart-picker')[0];
        chartPicker.addEventListener('change', event => {
            if (chartPicker.value == 'rotation') {
                this.dpsResourcesPlotElem.classList.add('hide');
                this.rotationPlotElem.classList.remove('hide');
            }
            else {
                this.dpsResourcesPlotElem.classList.remove('hide');
                this.rotationPlotElem.classList.add('hide');
            }
        });
        this.dpsResourcesPlotElem = this.rootElem.getElementsByClassName('dps-resources-plot')[0];
        this.dpsResourcesPlot = new ApexCharts(this.dpsResourcesPlotElem, {
            chart: {
                type: 'line',
                foreColor: 'white',
                id: 'dpsResources',
                animations: {
                    enabled: false,
                },
                height: '100%',
            },
            colors: [
                dpsColor,
                manaColor,
            ],
            series: [],
            xaxis: {
                title: {
                    text: 'Time (s)',
                },
                type: 'datetime',
            },
            yaxis: {},
            noData: {
                text: 'Waiting for data...',
            },
            stroke: {
                width: 2,
                curve: 'straight',
            },
        });
        this.rotationPlotElem = this.rootElem.getElementsByClassName('rotation-plot')[0];
        this.rotationLabels = this.rootElem.getElementsByClassName('rotation-labels')[0];
        this.rotationTimeline = this.rootElem.getElementsByClassName('rotation-timeline')[0];
    }
    onSimResult(resultData) {
        this.resultData = resultData;
        if (this.rendered) {
            this.updatePlot();
        }
    }
    updatePlot() {
        const players = this.resultData.result.getPlayers(this.resultData.filter);
        if (players.length != 1) {
            return;
        }
        const player = players[0];
        const duration = this.resultData.result.result.firstIterationDuration || 1;
        let manaLogs = player.manaChangedLogs;
        let dpsLogs = player.dpsLogs;
        let mcdLogs = player.majorCooldownLogs;
        let mcdAuraLogs = player.majorCooldownAuraUptimeLogs;
        if (dpsLogs.length == 0) {
            return;
        }
        const maxDps = dpsLogs[maxIndex(dpsLogs.map(l => l.dps))].dps;
        const dpsAxisMax = (Math.floor(maxDps / 100) + 1) * 100;
        // Figure out how much to vertically offset cooldown icons, for cooldowns
        // used very close to each other. This is so the icons don't overlap.
        const MAX_ALLOWED_DIST = 10;
        const cooldownIconOffsets = mcdLogs.map((mcdLog, mcdIdx) => mcdLogs.filter((cdLog, cdIdx) => (cdIdx < mcdIdx) && (cdLog.timestamp > mcdLog.timestamp - MAX_ALLOWED_DIST)).length);
        const distinctMcdAuras = distinct(mcdAuraLogs, (a, b) => a.aura.equalsIgnoringTag(b.aura));
        // Sort by name so auras keep their same colors even if timings change.
        distinctMcdAuras.sort((a, b) => stringComparator(a.aura.name, b.aura.name));
        const mcdAuraColors = mcdAuraLogs.map(mcdAuraLog => actionColors[distinctMcdAuras.findIndex(dAura => dAura.aura.equalsIgnoringTag(mcdAuraLog.aura))]);
        const showMana = manaLogs.length > 0;
        const maxMana = showMana ? manaLogs[0].valueBefore : 0;
        let options = {
            series: [{
                    name: 'DPS',
                    type: 'line',
                    data: dpsLogs.map(log => {
                        return {
                            x: this.toDatetime(log.timestamp),
                            y: log.dps,
                        };
                    }),
                }],
            xaxis: {
                min: this.toDatetime(0).getTime(),
                max: this.toDatetime(duration).getTime(),
                type: 'datetime',
                tickAmount: 10,
                decimalsInFloat: 1,
                labels: {
                    show: true,
                    formatter: (defaultValue, timestamp) => {
                        return (timestamp / 1000).toFixed(1);
                    },
                },
                title: {
                    text: 'Time (s)',
                },
            },
            yaxis: [
                {
                    color: dpsColor,
                    seriesName: 'DPS',
                    min: 0,
                    max: dpsAxisMax,
                    tickAmount: 10,
                    decimalsInFloat: 0,
                    title: {
                        text: 'DPS',
                        style: {
                            color: dpsColor,
                        },
                    },
                    axisBorder: {
                        show: true,
                        color: dpsColor,
                    },
                    axisTicks: {
                        color: dpsColor,
                    },
                    labels: {
                        minWidth: 30,
                        style: {
                            colors: [dpsColor],
                        },
                    },
                },
            ],
            annotations: {
                position: 'back',
                xaxis: mcdAuraLogs.map((log, i) => {
                    return {
                        x: this.toDatetime(log.gainedAt).getTime(),
                        x2: this.toDatetime(log.fadedAt).getTime(),
                        fillColor: mcdAuraColors[i],
                    };
                }),
                points: mcdLogs.map((log, i) => {
                    return {
                        x: this.toDatetime(log.timestamp).getTime(),
                        y: 0,
                        image: {
                            path: log.cooldownId.iconUrl,
                            width: 20,
                            height: 20,
                            offsetY: cooldownIconOffsets[i] * -25,
                        },
                    };
                }),
            },
            tooltip: {
                enabled: true,
                custom: (data) => {
                    if (data.seriesIndex == 0) {
                        // DPS
                        const log = dpsLogs[data.dataPointIndex];
                        return `<div class="timeline-tooltip dps">
							<div class="timeline-tooltip-header">
								<span class="bold">${log.timestamp.toFixed(2)}s</span>
							</div>
							<div class="timeline-tooltip-body">
								<ul class="timeline-dps-events">
									${log.damageLogs.map(damageLog => {
                            let iconElem = '';
                            if (damageLog.cause.iconUrl) {
                                iconElem = `<img class="timeline-tooltip-icon" src="${damageLog.cause.iconUrl}">`;
                            }
                            return `
										<li>
											${iconElem}
											<span>${damageLog.cause.name}:</span>
											<span class="series-color">${damageLog.resultString()}</span>
										</li>`;
                        }).join('')}
								</ul>
								<div class="timeline-tooltip-body-row">
									<span class="series-color">DPS: ${log.dps.toFixed(2)}</span>
								</div>
							</div>
							${log.activeAuras.length == 0 ? '' : `
								<div class="timeline-tooltip-auras">
									<div class="timeline-tooltip-body-row">
										<span class="bold">Active Auras</span>
									</div>
									<ul class="timeline-active-auras">
										${log.activeAuras.map(auraLog => {
                            let iconElem = '';
                            if (auraLog.aura.iconUrl) {
                                iconElem = `<img class="timeline-tooltip-icon" src="${auraLog.aura.iconUrl}">`;
                            }
                            return `
											<li>
												${iconElem}
												<span>${auraLog.aura.name}</span>
											</li>`;
                        }).join('')}
									</ul>
								</div>`}
						</div>`;
                    }
                    else if (data.seriesIndex == 1) {
                        // Mana
                        const log = manaLogs[data.dataPointIndex];
                        return `<div class="timeline-tooltip mana">
							<div class="timeline-tooltip-header">
								<span class="bold">${log.timestamp.toFixed(2)}s</span>
							</div>
							<div class="timeline-tooltip-body">
								<div class="timeline-tooltip-body-row">
									<span class="series-color">Before: ${log.valueBefore.toFixed(1)} (${(log.valueBefore / maxMana * 100).toFixed(0)}%)</span>
								</div>
								<ul class="timeline-mana-events">
									${log.logs.map(manaChangedLog => {
                            let iconElem = '';
                            if (manaChangedLog.cause.iconUrl) {
                                iconElem = `<img class="timeline-tooltip-icon" src="${manaChangedLog.cause.iconUrl}">`;
                            }
                            return `
										<li>
											${iconElem}
											<span>${manaChangedLog.cause.name}:</span>
											<span class="series-color">${manaChangedLog.resultString()}</span>
										</li>`;
                        }).join('')}
								</ul>
								<div class="timeline-tooltip-body-row">
									<span class="series-color">After: ${log.valueAfter.toFixed(1)} (${(log.valueAfter / maxMana * 100).toFixed(0)}%)</span>
								</div>
							</div>
							${log.activeAuras.length == 0 ? '' : `
								<div class="timeline-tooltip-auras">
									<div class="timeline-tooltip-body-row">
										<span class="bold">Active Auras</span>
									</div>
									<ul class="timeline-active-auras">
										${log.activeAuras.map(auraLog => {
                            let iconElem = '';
                            if (auraLog.aura.iconUrl) {
                                iconElem = `<img class="timeline-tooltip-icon" src="${auraLog.aura.iconUrl}">`;
                            }
                            return `
											<li>
												${iconElem}
												<span>${auraLog.aura.name}</span>
											</li>`;
                        }).join('')}
									</ul>
								</div>`}
						</div>`;
                    }
                }
            },
            chart: {
                events: {
                    beforeResetZoom: () => {
                        return {
                            xaxis: {
                                min: this.toDatetime(0),
                                max: this.toDatetime(duration),
                            },
                        };
                    },
                },
            },
        };
        if (showMana) {
            options.series.push({
                name: 'Mana',
                type: 'line',
                data: manaLogs.map(log => {
                    return {
                        x: this.toDatetime(log.timestamp),
                        y: log.valueAfter,
                    };
                }),
            });
            options.yaxis.push({
                seriesName: 'Mana',
                opposite: true,
                min: 0,
                max: maxMana,
                tickAmount: 10,
                title: {
                    text: 'Mana',
                    style: {
                        color: manaColor,
                    },
                },
                axisBorder: {
                    show: true,
                    color: manaColor,
                },
                axisTicks: {
                    color: manaColor,
                },
                labels: {
                    minWidth: 30,
                    style: {
                        colors: [manaColor],
                    },
                    formatter: (val) => {
                        const v = parseFloat(val);
                        return `${v.toFixed(0)} (${(v / maxMana * 100).toFixed(0)}%)`;
                    },
                },
            });
        }
        this.dpsResourcesPlot.updateOptions(options);
        const meleeActionIds = player.getMeleeActions().map(action => action.actionId);
        const spellActionIds = player.getSpellActions().map(action => action.actionId);
        const getActionCategory = (actionId) => {
            const fixedCategory = idToCategoryMap[actionId.spellId];
            if (fixedCategory) {
                return fixedCategory;
            }
            else if (actionId.otherId) {
                return 0;
            }
            else if (meleeActionIds.find(meleeActionId => meleeActionId.equals(actionId))) {
                return 1;
            }
            else if (spellActionIds.find(spellActionId => spellActionId.equals(actionId))) {
                return 2;
            }
            else {
                return 3;
            }
        };
        const castsByAbility = Object.values(bucket(player.castBeganLogs, log => {
            if (idsToGroupForRotation.includes(log.castId.spellId)) {
                return log.castId.toStringIgnoringTag();
            }
            else {
                return log.castId.toString();
            }
        }));
        castsByAbility.sort((a, b) => {
            const categoryA = getActionCategory(a[0].castId);
            const categoryB = getActionCategory(b[0].castId);
            if (categoryA != categoryB) {
                return categoryA - categoryB;
            }
            else {
                return stringComparator(a[0].castId.name, b[0].castId.name);
            }
        });
        this.rotationLabels.innerHTML = `
			<div class="rotation-label-header"></div>
		`;
        this.rotationTimeline.innerHTML = `
			<div class="rotation-timeline-header">
				<canvas class="rotation-timeline-canvas"></canvas>
			</div>
		`;
        this.drawRotationTimeRuler(this.rotationTimeline.getElementsByClassName('rotation-timeline-canvas')[0], duration);
        castsByAbility.forEach(abilityCasts => {
            const actionId = abilityCasts[0].castId;
            const labelElem = document.createElement('div');
            labelElem.classList.add('rotation-label', 'rotation-row');
            const labelText = idsToGroupForRotation.includes(actionId.spellId) ? actionId.baseName : actionId.name;
            labelElem.innerHTML = `
				<a class="rotation-label-icon"></a>
				<span class="rotation-label-text">${labelText}</span>
			`;
            const labelIcon = labelElem.getElementsByClassName('rotation-label-icon')[0];
            actionId.setBackgroundAndHref(labelIcon);
            this.rotationLabels.appendChild(labelElem);
            const rowElem = document.createElement('div');
            rowElem.classList.add('rotation-timeline-row', 'rotation-row');
            rowElem.style.width = this.timeToPx(duration);
            abilityCasts.forEach(castLog => {
                const castElem = document.createElement('div');
                castElem.classList.add('rotation-timeline-cast');
                castElem.style.left = this.timeToPx(castLog.timestamp);
                rowElem.appendChild(castElem);
                const iconElem = document.createElement('a');
                iconElem.classList.add('rotation-timeline-cast-icon');
                actionId.setBackground(iconElem);
                castElem.appendChild(iconElem);
                tippy(castElem, {
                    content: `${castLog.castId.name}: ${castLog.castTime.toFixed(2)}s (${castLog.timestamp.toFixed(2)}s - ${(castLog.timestamp + castLog.castTime).toFixed(2)}s)`,
                    allowHTML: true,
                });
            });
            this.rotationTimeline.appendChild(rowElem);
        });
    }
    timeToPxValue(time) {
        return time * 100;
    }
    timeToPx(time) {
        return this.timeToPxValue(time) + 'px';
    }
    drawRotationTimeRuler(canvas, duration) {
        const height = 30;
        canvas.width = this.timeToPxValue(duration);
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = 'white';
        ctx.font = 'bold 14px SimDefaultFont';
        ctx.fillStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Bottom border line
        ctx.moveTo(0, height);
        ctx.lineTo(canvas.width, height);
        // Tick lines
        const numTicks = 1 + Math.floor(duration * 10);
        for (let i = 0; i <= numTicks; i++) {
            const time = i * 0.1;
            let x = this.timeToPxValue(time);
            if (i == 0) {
                ctx.textAlign = 'left';
                x++;
            }
            else if (time == duration) {
                ctx.textAlign = 'right';
                x--;
            }
            else {
                ctx.textAlign = 'center';
            }
            let lineHeight = 0;
            if (i % 10 == 0) {
                lineHeight = height * 0.5;
                ctx.fillText(time + 's', x, height - height * 0.6);
            }
            else if (i % 5 == 0) {
                lineHeight = height * 0.25;
            }
            else {
                lineHeight = height * 0.125;
            }
            ctx.moveTo(x, height);
            ctx.lineTo(x, height - lineHeight);
        }
        ctx.stroke();
    }
    render() {
        setTimeout(() => {
            this.dpsResourcesPlot.render();
            this.rendered = true;
            if (this.resultData != null) {
                this.updatePlot();
            }
        }, 300);
    }
    toDatetime(timestamp) {
        return new Date(timestamp * 1000);
    }
}
// Hard-coded spell categories for controlling rotation ordering.
const idToCategoryMap = {
    [6774]: 1.1,
    [26866]: 1.2,
    [26865]: 1.3,
    [26867]: 1.3, // Rupture
};
const idsToGroupForRotation = [
    6774,
    26866,
    26865,
    26867, // Rupture
];
