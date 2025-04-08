import React from 'react';

import { send_command, take_control } from './modules/network/connections.js';
import { AdminRadarWidget } from './modules/widgets/AdminRadar.js';

import { CommandEditorWidget } from './modules/widgets/CommandEditor.js';
import { timerscounter } from './modules/utils/updatetimers.js';
import { QuestPointsController } from './modules/widgets/QuestPointsController.js';
import { ShipsDisplay, StationsDisplay } from './modules/widgets/ShipsDisplay.js';
import { FlaresController } from './modules/widgets/FlaresController.js';

import './styles/Administration.css';

export class GameMastering extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected: null,
			sf_timer_value: 0
		};
		take_control(null);
	}

	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(() => this.forceUpdate, 30);
		timerscounter.add(this.constructor.name, timer_id);
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	restart_simulation = () => {
		send_command('server', null, 'restart', null, true);
	};

	autoUpdateMap = (value) => {
		send_command('hBodiesPool', 'admin', 'set_realtime_update', { value: value });
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

	get_control_block = () => {
		if (this.props.username === 'admin') {
			return (
				<div className="SystemsSection">
					<ShipsDisplay selectModule={this.props.selectModule} />
					<StationsDisplay />
					<CommandEditorWidget />
					<FlaresController />
					<QuestPointsController />
				</div>
			);
		}

		return (
			<div className="SystemsSection">
				<ShipsDisplay selectModule={this.props.selectModule} />
			</div>
		);
	};

	render() {
		return (
			<div className="Administration">
				<b>Administration</b>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row'
					}}
				>
					<AdminRadarWidget />
					{this.get_control_block()}
				</div>
			</div>
		);
	}
}
