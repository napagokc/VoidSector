import React from 'react';

import { PlayersRadarWidget } from './modules/widgets/PlayerRadar.js';
import { get_websocket_state, take_control, EVENT_WEBSOCKET_IS_OPEN } from './modules/network/connections';

import './styles/PilotStation.css';

export class CommonRadarStation extends React.Component {
	constructor(props) {
		super(props);
		this._handle_websocket_bind = this._handle_websocket.bind(this);
	}

	_handle_websocket() {
		take_control('Sirocco');
		document.addEventListener(EVENT_WEBSOCKET_IS_OPEN, this._handle_websocket_bind);
	}

	componentDidMount() {
		if (get_websocket_state() !== 1) {
			document.addEventListener(EVENT_WEBSOCKET_IS_OPEN, this._handle_websocket_bind);
		} else take_control('Sirocco');
	}

	render() {
		return (
			<div className="CommonRadarStation">
				<PlayersRadarWidget />
			</div>
		);
	}
}
