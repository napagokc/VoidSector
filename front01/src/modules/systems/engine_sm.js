import React from 'react';

import { send_command, get_system_state } from '../network/connections';
import { NumericControlWidjet } from '../widgets/NumericControlWidget.js';
import { timerscounter } from '../utils/updatetimers';
import { get_locales } from '../locales/locales';

export class EngineControlWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mark_id: null,
			status: null,
			engine_power: 1,
			velocity: null,
			direction: null,
			deltaV: null,
			heat_level: null
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		this.setState(get_system_state('engine_sm'));
	};

	is_disabled = () => {
		return !this.state.mark_id || this.state.status !== 'OK';
	};

	//accPrograde, accNormal
	send_acceleration = (engine_key, direction_scalar) => {
		let params = { [engine_key]: direction_scalar };
		if (this.state.mark_id) send_command('ship.engine_sm', this.state.mark_id, 'set_acceleration', params);
	};

	send_prediction_depth = (prediction_depth) => {
		if (this.state.mark_id) {
			send_command('ship.engine_sm', this.state.mark_id, 'set_prediction_depth', { value: prediction_depth });
		}
	};

	get_buttons_block = () => {
		return (
			<div className="AccelerationController_btnblock">
				<button
					className="non_selectable_text"
					disabled={this.is_disabled()}
					onMouseUp={(e) => {
						this.send_acceleration('acceleration', 0);
					}}
					onMouseDown={(e) => {
						this.send_acceleration('acceleration', 1 * this.state.engine_power);
					}}
					onMouseLeave={(e) => {
						this.send_acceleration('acceleration', 0);
					}}
				>
					🠉
				</button>

				<button
					className="non_selectable_text"
					disabled={this.is_disabled()}
					onMouseUp={(e) => {
						this.send_acceleration('rotation', 0);
					}}
					onMouseDown={(e) => {
						this.send_acceleration('rotation', 1);
					}}
					onMouseLeave={(e) => {
						this.send_acceleration('rotation', 0);
					}}
				>
					🠈
				</button>
				<button
					className="non_selectable_text"
					disabled={this.is_disabled()}
					onMouseUp={(e) => {
						this.send_acceleration('acceleration', 0);
					}}
					onMouseDown={(e) => {
						this.send_acceleration('acceleration', -1 * this.state.engine_power);
					}}
					onMouseLeave={(e) => {
						this.send_acceleration('acceleration', 0);
					}}
				>
					🠋
				</button>
				<button
					className="non_selectable_text"
					disabled={this.is_disabled()}
					onMouseUp={(e) => {
						this.send_acceleration('rotation', 0);
					}}
					onMouseDown={(e) => {
						this.send_acceleration('rotation', -1);
					}}
					onMouseLeave={(e) => {
						this.send_acceleration('rotation', 0);
					}}
				>
					🠊
				</button>
			</div>
		);
	};

	render() {
		return (
			<div className="AccelerationController">
				<b> {get_locales('Acceleration Control')}</b>
				<label>
					{get_locales('speed')}: {this.state.velocity ? this.state.velocity : 0}
				</label>
				<label>
					{get_locales('direction')}: {this.state.direction ? this.state.direction : 0}
				</label>
				<label>
					{get_locales('deltaV')}: {this.state.deltaV ? this.state.deltaV : 0}
				</label>
				{this.get_buttons_block()}
				<NumericControlWidjet
					disabled={this.is_disabled()}
					label="prediction_depth"
					init_value={10}
					min={5}
					max={60}
					step={1}
					onChange={this.send_prediction_depth}
				/>
				<NumericControlWidjet
					disabled={this.is_disabled()}
					label="engine_power"
					init_value={1}
					min={0}
					max={1}
					step={0.001}
					onChange={(value) => {
						this.setState({ engine_power: value });
					}}
				/>
				<span className="AccelerationHeatbar">
					<label>{get_locales('overheat')}:</label>
					<progress value={this.state.heat_level ? this.state.heat_level : 0} max={100}></progress>
				</span>
			</div>
		);
	}
}
