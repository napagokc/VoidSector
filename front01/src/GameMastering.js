import React from 'react';

import { take_control } from './modules/network/connections.js';
import { AdminRadarWidget } from './modules/widgets/AdminRadar.js';

import { CommandEditorWidget } from './modules/widgets/CommandEditor.js';
import { QuestPointsController } from './modules/widgets/QuestPointsController.js';
import { ShipsDisplay, StationsDisplay } from './modules/widgets/ShipsDisplay.js';
import { FlaresController } from './modules/widgets/FlaresController.js';

import './styles/Administration.css';

export class GameMastering extends React.Component {
	constructor(props) {
		super(props);
		take_control(null);
	}

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
				<div className="flex">
					<AdminRadarWidget />
					{this.get_control_block()}
				</div>
			</div>
		);
	}
}
