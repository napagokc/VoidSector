import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { send_command, get_system_state } from '../network/connections';

import { NumericControlWidjet } from '../widgets/NumericControlWidget';

import { DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT } from '../utils/constants';

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
			heat_level: null,
			active_directions: []
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));

		document.addEventListener('keydown', this.onKeyDown);
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
		document.removeEventListener('keydown', this.onKeyDown);
	}

	proceed_data_message = () => {
		this.setState(get_system_state('engine_sm'));
	};

	is_disabled = () => {
		return !this.state.mark_id || this.state.status !== 'OK';
	};

	send_prediction_depth = (prediction_depth) => {
		if (this.state.mark_id) {
			send_command('ship.engine_sm', this.state.mark_id, 'set_prediction_depth', { value: prediction_depth });
		}
	};

	_applyNavVector = (acc, rot, dir) => {
		switch (dir) {
			case DIR_UP:
				acc += this.state.engine_power;
				break;
			case DIR_DOWN:
				acc -= this.state.engine_power;
				break;
			case DIR_LEFT:
				rot += 1;
				break;
			case DIR_RIGHT:
				rot -= 1;
				break;
			default:
				return [acc, rot];
		}

		return [acc, rot];
	};

	_apply_acceleration = (new_directions) => {
		this.setState({ active_directions: new_directions }, () => {
			let acc = 0;
			let rot = 0;
			this.state.active_directions.forEach((dir) => {
				[acc, rot] = this._applyNavVector(acc, rot, dir);
			});
			send_command('ship.engine_sm', this.state.mark_id, 'set_acceleration', {
				acceleration: acc,
				rotation: rot
			});
		});
	};

	_directionKeyHandler = (keyCode, dir) => {
		const timer_id = this.constructor.name + keyCode;
		if (timerscounter.get(timer_id)) return;
		let timerHandler = (event) => {
			if (event.keyCode === keyCode) {
				clearInterval(timerscounter.get(timer_id));
				timerscounter.add(timer_id, false);
				document.removeEventListener('keyup', timerHandler);
			}
		};

		timerscounter.add(
			timer_id,
			setInterval(() => {
				let active_directions = this.state.active_directions;
				if (active_directions.indexOf(dir) >= 0) return;

				let keyupHandler = (event) => {
					if (event.keyCode === keyCode) {
						this._apply_acceleration(this.state.active_directions.filter((item) => item !== dir));

						timerscounter.add(timer_id, false);
						document.removeEventListener('keyup', keyupHandler);
					}
				};

				clearInterval(timerscounter.get(timer_id));
				active_directions.push(dir);
				this._apply_acceleration(active_directions);
				document.addEventListener('keyup', keyupHandler);
			}, 30)
		);

		document.addEventListener('keyup', timerHandler);
	};

	onKeyDown = (event) => {
		if (this.is_disabled()) return;

		switch (event.keyCode) {
			case KeyboardEvent.DOM_VK_UP:
				this._directionKeyHandler(event.keyCode, DIR_UP);
				break;
			case KeyboardEvent.DOM_VK_DOWN:
				this._directionKeyHandler(event.keyCode, DIR_DOWN);
				break;
			case KeyboardEvent.DOM_VK_LEFT:
				this._directionKeyHandler(event.keyCode, DIR_LEFT);
				break;
			case KeyboardEvent.DOM_VK_RIGHT:
				this._directionKeyHandler(event.keyCode, DIR_RIGHT);
				break;
			default:
				return;
		}
	};

	onNavBtnDown = (event) => {
		const timer_id = this.constructor.name + '_navBtn';
		let dir = event.target.dataset.dir;
		let timerHandler = () => {
			clearInterval(timerscounter.get(timer_id));
			event.target.removeEventListener('mouseup', timerHandler);
			event.target.removeEventListener('mouseleave', timerHandler);
		};

		timerscounter.add(
			timer_id,
			setInterval(() => {
				let active_directions = this.state.active_directions;
				if (active_directions.indexOf(dir) >= 0) return;

				let clearHandler = () => {
					this._apply_acceleration(this.state.active_directions.filter((item) => item !== dir));

					document.removeEventListener('mouseup', clearHandler);
					event.target.removeEventListener('mouseleave', clearHandler);
				};

				timerHandler();
				active_directions.push(dir);
				this._apply_acceleration(active_directions);
				document.addEventListener('mouseup', clearHandler);
				event.target.addEventListener('mouseleave', clearHandler);
			}, 30)
		);

		event.target.addEventListener('mouseup', timerHandler);
		event.target.addEventListener('mouseleave', timerHandler);
	};

	get_buttons_block = () => {
		return (
			<div className="AccelerationController_btnblock">
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_UP}>
					🠉
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_LEFT}>
					🠈
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_DOWN}>
					🠋
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_RIGHT}>
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
