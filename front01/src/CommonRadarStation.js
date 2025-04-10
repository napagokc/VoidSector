import React from 'react';

import { PlayersRadarWidget } from './modules/widgets/PlayerRadar';
import { ensureWebsocketIsOpen, take_control } from './modules/network/connections';

import './styles/PilotStation.css';

export class CommonRadarStation extends React.Component {
	componentDidMount() {
		ensureWebsocketIsOpen(() => take_control('Sirocco'));
	}

	render() {
		return (
			<div className="CommonRadarStation">
				<PlayersRadarWidget />
			</div>
		);
	}
}
