import React from 'react';

import { timerscounter } from '../utils/updatetimers';

import { get_system_state } from '../network/connections';

export class HospitalCrewWidget extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		let med_data = get_system_state('med_sm');
		if (med_data) this.setState(med_data);
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>Hospital Crew Control</b>
				{this.state.units && this.state.capacity && (
					<label>
						{this.state.units}/{this.state.capacity}
					</label>
				)}
			</div>
		);
	}
}
