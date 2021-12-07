import { RaidSimRequest, RaidSimResult } from '/tbc/core/proto/api.js';
import { sum } from '/tbc/core/utils.js';

import { parseActionMetrics } from './metrics_helpers.js';
import { ResultComponent, ResultComponentConfig } from './result_component.js';

declare var Chart: any;

export class SourceChart extends ResultComponent {
  constructor(config: ResultComponentConfig) {
		config.rootCssClass = 'source-chart-root';
    super(config);
	}

	onSimResult(request: RaidSimRequest, result: RaidSimResult) {
		const chartBounds = this.rootElem.getBoundingClientRect();

		this.rootElem.textContent = '';
		const chartCanvas = document.createElement("canvas");
		chartCanvas.height = chartBounds.height;
		chartCanvas.width = chartBounds.width;

		const colors: Array<string> = ['red', 'blue', 'lawngreen'];

		parseActionMetrics(result.raidMetrics!.parties[0].players[0].actions).then(actionMetrics => {
			const names = actionMetrics.map(am => am.name);
			const totalDmg = sum(actionMetrics.map(actionMetric => actionMetric.totalDmg));
			const vals = actionMetrics.map(actionMetric => actionMetric.totalDmg / totalDmg);

			const ctx = chartCanvas.getContext('2d');
			const chart = new Chart(ctx, {
				type: 'pie',
				data: {
					labels: names,
					datasets: [{
						data: vals,
						backgroundColor: colors,
					}],
				},
				options: {
					plugins: {
						legend: {
							display: true,
							position: 'right',
						}
					},
				},
			});
			this.rootElem.appendChild(chartCanvas);
		});
	}
}