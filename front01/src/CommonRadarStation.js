import React from 'react';

import { PlayersRadarWidget } from './modules/widgets/PlayerRadar.js';
import { timerscounter } from './modules/utils/updatetimers.js';
import { take_control } from './modules/network/connections.js';

import './styles/PilotStation.css';

export class CommonRadarStation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected: null,
			is_taking_damage: false
		};
	}

	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(this.proceed_data_message, 30);
		timerscounter.add(this.constructor.name, timer_id);

		take_control('Sirocco');
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	render() {
		return (
			<div className={'CommonRadarStation'}>
				<PlayersRadarWidget />
			</div>
		);
	}
}
