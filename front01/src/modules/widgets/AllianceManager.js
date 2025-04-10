import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { ensureWebsocketIsOpen, get_system_state, send_command } from '../network/connections';

export class AllianceManager extends React.Component {
	constructor() {
		super();
		this.state = {
			alliance: {},
			mark_id: null,
			input_value: ''
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_message, 1000));

		ensureWebsocketIsOpen(() => setTimeout(this.proceed_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_message = () => {
		this.setState(get_system_state('launcher_sm'));
	};

	add_to_allies = (mark_id) => {
		send_command('ship.launcher_sm', this.state.mark_id, 'add_to_alliance', { mark_id: mark_id });
	};

	remove_from_alies = (mark_id) => {
		send_command('ship.launcher_sm', this.state.mark_id, 'remove_from_alliance', { mark_id: mark_id });
	};

	get_alliance_list = () => {
		let result = [];
		for (let tmp_i in this.state.alliance) {
			result.push(
				<button
					key={tmp_i}
					onClick={(e) => {
						this.remove_from_alies(this.state.alliance[tmp_i]);
					}}
				>
					{this.state.alliance[tmp_i]}[x]
				</button>
			);
		}

		return <div>{result}</div>;
	};

	get_input_panel = () => {
		return (
			<React.Fragment>
				<input
					value={this.state.input_value}
					onChange={(e) => {
						this.setState({ input_value: e.target.value });
					}}
				/>
				<button
					onClick={(e) => {
						this.add_to_allies(this.state.input_value);
					}}
				>
					{get_locales('mark_as_allias')}
				</button>
			</React.Fragment>
		);
	};

	render() {
		return (
			<div className="SystemControlWidget AllianceManager">
				<b>{get_locales('Alliance_controller')}</b>
				{this.get_alliance_list()}
				{this.get_input_panel()}
			</div>
		);
	}
}
