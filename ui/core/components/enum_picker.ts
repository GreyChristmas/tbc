import { Race } from '/tbc/core/proto/common.js';
import { specToEligibleRaces } from '/tbc/core/proto_utils/utils.js';
import { raceNames } from '/tbc/core/proto_utils/names.js';
import { Sim } from '/tbc/core/sim.js';
import { TypedEvent } from '/tbc/core/typed_event.js';

import { Component } from './component.js';

declare var tippy: any;

export interface EnumPickerConfig {
  label?: string,
	labelTooltip?: string,
  defaultValue?: number,

  // names and values are parallel arrays
  names: Array<string>;
  values: Array<number>;

  changedEvent: (sim: Sim<any>) => TypedEvent<any>;
  getValue: (sim: Sim<any>) => number;
  setValue: (sim: Sim<any>, newValue: number) => void;
}

export class EnumPicker extends Component {
  constructor(parent: HTMLElement, sim: Sim<any>, config: EnumPickerConfig) {
    super(parent, 'enum-picker-root');

    if (config.label) {
      const label = document.createElement('span');
      label.classList.add('enum-picker-label');
      label.textContent = config.label;
      this.rootElem.appendChild(label);

			if (config.labelTooltip) {
				tippy(label, {
					'content': config.labelTooltip,
					'allowHTML': true,
				});
			}
    }

    const selector = document.createElement('select');
    selector.classList.add('enum-picker-selector');
    this.rootElem.appendChild(selector);

    config.values.forEach((value, idx) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = config.names[idx];
      selector.appendChild(option);
    });

    selector.value = String(config.getValue(sim));
    config.changedEvent(sim).on(() => {
      selector.value = String(config.getValue(sim));
    });

    if (config.defaultValue) {
      config.setValue(sim, config.defaultValue);
    }

    selector.addEventListener('change', event => {
      config.setValue(sim, parseInt(selector.value));
    });
  }
}
