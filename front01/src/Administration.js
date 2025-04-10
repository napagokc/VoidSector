import React from 'react';

import { send_command } from './modules/network/connections.js';
import { AdminRadarWidget } from './modules/widgets/AdminRadar.js';
import { PerformanceViewer } from './modules/widgets/PerformanceWidget.js';

import { timerscounter } from './modules/utils/updatetimers.js';
import { QuestPointsController } from './modules/widgets/QuestPointsController.js';

import './styles/Administration.css';

export class Administration extends React.Component {
	restart_simulation = () => {
		send_command('server', null, 'restart', null, true);
	};

	autoUpdateMap = (value) => {
		send_command('hBodiesPool', 'admin', 'set_realtime_update', { value: value });
	};

	reload_predictors = () => {
		send_command('server', 'admin', 'reload_predictors', {});
	};

	render() {
		return (
			<div className="Administration">
				<b>Administration</b>
				<div className="AdminControlPanel"></div>
				<div className="flex">
					<AdminRadarWidget />
					<div className="SystemsSection">
						<div className="SystemsSectionLevel">
							<PerformanceViewer></PerformanceViewer>
						</div>

						<button
							onClick={(e) => {
								this.reload_predictors();
							}}
						>
							RELOAD PREDICTORS
						</button>

						<QuestPointsController />
					</div>
				</div>
			</div>
		);
	}
}
