import React from 'react';

import { send_command, get_system_state } from '../network/connections';
import { timerscounter } from '../utils/updatetimers';

export class DamageControlWidget extends React.Component {
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
		this.setState(get_system_state('damage_sm'));
	};

	get_systems_hp = () => {
		let result = [];
		if (this.state?.systems_hp) {
			for (let system_name in this.state.systems_hp) {
				let current_hp = this.state.systems_hp[system_name].current_hp.toFixed(2);
				result.push(
					<label key={system_name}>
						{system_name}:{current_hp}/{this.state.systems_hp[system_name].max_hp}
					</label>
				);
			}
		}

		return result;
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>DamageControl</b>
				{this.get_systems_hp()}
			</div>
		);
	}
}
