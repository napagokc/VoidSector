import React from 'react';

import { take_control } from './modules/network/connections';

import { AdminRadarWidget } from './modules/widgets/AdminRadar';
import { CommandEditorWidget } from './modules/widgets/CommandEditor';
import { QuestPointsController } from './modules/widgets/QuestPointsController';
import { ShipsDisplay, StationsDisplay } from './modules/widgets/ShipsDisplay';
import { FlaresController } from './modules/widgets/FlaresController';

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
