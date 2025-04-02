import React from 'react';

import { get_system_state, send_command } from '../network/connections';
import { timerscounter } from '../utils/updatetimers';
import { get_locales } from '../locales/locales';

export class AllianceManager extends React.Component {
	constructor() {
		super();
		this.state = {
			data: {},
			input_value: ''
		};
	}

	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(this.proceed_message, 1000);
		timerscounter.add(this.constructor.name, timer_id);
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_message = () => {
		this.setState({ data: get_system_state('launcher_sm') });
	};

	add_to_allies = (mark_id) => {
		send_command('ship.launcher_sm', this.state.data.mark_id, 'add_to_alliance', { mark_id: mark_id });
	};

	remove_from_alies = (mark_id) => {
		send_command('ship.launcher_sm', this.state.data.mark_id, 'remove_from_alliance', { mark_id: mark_id });
	};

	get_alliance_list = () => {
		let result = [];
		if (this.state?.data?.alliance) {
			for (let tmp_i in this.state.data.alliance) {
				result.push(
					<button
						onClick={(e) => {
							this.remove_from_alies(this.state.data.alliance[tmp_i]);
						}}
					>
						{this.state.data.alliance[tmp_i]}[x]
					</button>
				);
			}
		}

		return <div>{result}</div>;
	};

	get_input_panel = () => {
		return (
			<div>
				<input
					style={{
						width: '100px'
					}}
					onChange={(e) => {
						this.setState({ input_value: e.target.value });
					}}
					value={this.state.input_value}
				></input>
				<button
					onClick={(e) => {
						this.add_to_allies(this.state.input_value);
					}}
				>
					{get_locales('mark_as_allias')}
				</button>
			</div>
		);
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>{get_locales('Alliance_controller')}</b>
				{this.get_alliance_list()}
				{this.get_input_panel()}
			</div>
		);
	}
}
