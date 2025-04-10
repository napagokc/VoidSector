import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { send_command, get_system_state, get_observer_id } from '../network/connections';

import { NumericStepControlWidjet } from '../widgets/NumericControlWidget';

import '../../styles/RadarControlWidget.css';

export class RadarControlWidget extends React.Component {
	on_set_radar_arc = (value) => {
		send_command('ship.radar_sm', get_observer_id(), 'set_radar_arc', { radar_arc: parseInt(value) });
	};

	on_set_radar_dir = (value) => {
		send_command('ship.radar_sm', get_observer_id(), 'set_radar_dir', { radar_dir: 90 - parseInt(value) });
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>{get_locales('Radar control')}</b>
				<NumericStepControlWidjet
					label="distant_arc"
					init_value={10}
					min={5}
					max={360}
					step={1}
					onChange={this.on_set_radar_arc}
				/>
				<NumericStepControlWidjet
					label="distant_dir"
					init_value={0}
					min={-360}
					max={+360}
					step={3}
					onChange={this.on_set_radar_dir}
				/>
			</div>
		);
	}
}

export class RadarStatsWidget extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		let data = get_system_state('radar_sm');
		if (data) this.setState(data);
	};

	render() {
		return (
			<div className="RadarStatsWidget">
				<label>
					{get_locales('close_range')}: {this.state.close_range}
				</label>
				<label>
					{get_locales('distant_range')}: {this.state.distant_range}
				</label>
				<label>
					{get_locales('distant_dir')}: {this.state.distant_dir}
				</label>
				<label>
					{get_locales('distant_arc')}: {this.state.distant_arc}
				</label>
			</div>
		);
	}
}
