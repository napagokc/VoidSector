import React from 'react';

import { send_command, get_system_state } from '../network/connections';
import { timerscounter } from '../utils/updatetimers';

export class RnDControlWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			systems_upgrades: {}
		};
	}
	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(this.proceed_data_message, 30);
		timerscounter.add(this.constructor.name, timer_id);
	}

	componentWillUnmount() {
		let timer_id = timerscounter.get(this.constructor.name);
		clearInterval(timer_id);
	}

	proceed_data_message = () => {
		let perf_data = get_system_state('RnD_sm');
		if (perf_data) this.setState(perf_data);
	};

	onUpgrade = (system_name) => {
		send_command('ship.RnD_sm', this.state.mark_id, 'upgrade_system', { system: system_name });
	};

	get_systems_upgrades = () => {
		let result = [];
		for (let system_name in this.state.systems_upgrades) {
			let upgrade = this.state.systems_upgrades[system_name];
			let system_level = upgrade.current_level;
			let level_widgets = [];

			let i = 0;
			for (i; i < Number.parseInt(system_level); i++) {
				level_widgets.push(
					<button key={system_name + '_' + i} disabled>
						{upgrade.cost[i]}
					</button>
				);
			}

			if (upgrade.current_level < upgrade.maximal_level) {
				level_widgets.push(
					<button
						key={system_name + '_upgrade'}
						onClick={(e) => {
							this.onUpgrade(system_name);
						}}
					>
						{upgrade.cost[i]}
					</button>
				);
			}

			result.push(
				<div key={system_name} className="systemUpgradeUnit">
					<label>{system_name}</label>
					<div>{level_widgets}</div>
				</div>
			);
		}
		return result;
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>RnD control</b>
				{this.get_systems_upgrades()}
			</div>
		);
	}
}
