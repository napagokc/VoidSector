import React from 'react';

import { timerscounter } from '../utils/updatetimers';

import { ensureWebsocketIsOpen, send_command, get_solarflare } from '../network/connections';

export class FlaresController extends React.Component {
	constructor() {
		super();
		this.state = {
			sf_timer_value: 0
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_message, 1000));

		ensureWebsocketIsOpen(() => setTimeout(this.proceed_message, 30));
	}

	proceed_message = () => {
		this.setState(get_solarflare());
	};

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	get_solarFlare_control = () => {
		if (!('state' in this.state)) return null;

		return (
			<div className="solarFlare_control">
				<label>
					<b>Solar flare state:</b>
					{this.state.state.toString()}
				</label>
				<label>time2nextphase:{this.state.time2nextphase}</label>
				<label>probability:{this.state.probability}</label>
				<button
					onClick={() => {
						this.toogleSolarFlare(!this.state.state);
					}}
				>
					TOOGLE ACTIVITY
				</button>
				<button
					onClick={() => {
						this.toogleSolarFlareTimer(!this.state.timer_state);
					}}
				>
					TOOGLE TIMER
				</button>
				<input
					type="number"
					onChange={(e) => {
						this.setState({ sf_timer_value: e.target.value });
					}}
				></input>
				<button
					onClick={() => {
						this.setSolarFlareTimer();
					}}
				>
					SET TIMER OF CURRENT PHASE
				</button>
				<button
					onClick={() => {
						this.setHighProbFlare();
					}}
				>
					SET HIGH PROB
				</button>
				<button
					onClick={() => {
						this.setLowProbFlare();
					}}
				>
					SET LOW PROB
				</button>
			</div>
		);
	};

	setHighProbFlare = () => {
		send_command('solar_flare', 'admin', 'set_probability_value', { value: 'high' });
	};

	setLowProbFlare = () => {
		send_command('solar_flare', 'admin', 'set_probability_value', { value: 'low' });
	};

	toogleSolarFlare = (value) => {
		send_command('solar_flare', 'admin', 'set_solar_flare', { state: value });
	};

	toogleSolarFlareTimer = (value) => {
		send_command('solar_flare', 'admin', 'set_timer_state', { state: value });
	};

	setSolarFlareTimer = () => {
		send_command('solar_flare', 'admin', 'set_timer_value', { value: this.state.sf_timer_value });
	};

	render() {
		return this.get_solarFlare_control();
	}
}
