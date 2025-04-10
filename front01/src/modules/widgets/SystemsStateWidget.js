import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_server_systems_state } from '../network/connections';

export class SystemStateViewer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hidden: false,
			system_state: {}
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		this.setState({ system_state: get_server_systems_state() });
	};

	render() {
		let states = [];
		if (!this.state.hidden) {
			for (let k in this.state.system_state) {
				states.push(
					<label>
						{k}: {this.state.system_state[k]}
					</label>
				);
			}
		}

		return (
			<div className="AdminSystemViewer">
				<label
					onClick={() => {
						this.setState({ hidden: !this.state.hidden });
					}}
				>
					<b>{get_locales('SYSTEM STATE')}</b>
				</label>
				{states}
			</div>
		);
	}
}
