import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { send_command, get_system_state } from '../network/connections';

export class InteractionControlWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mark_id: null,
			interactable_objects: []
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
		let perf_data = get_system_state('interact_sm');
		if (perf_data) this.setState(perf_data);
	};

	onInteract = (target_id) => {
		send_command('ship.interact_sm', this.state.mark_id, 'interact', { target_id: target_id });
	};

	get_interactable_objects = () => {
		let result = [];
		for (let i in this.state.interactable_objects) {
			let iobj_id = this.state.interactable_objects[i];
			result.push(
				<span key={iobj_id}>
					<label>{iobj_id[0]}</label>
					<button
						onClick={(e) => {
							this.onInteract(iobj_id[0]);
						}}
					>
						{iobj_id[1]}
					</button>
				</span>
			);
		}

		return result;
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>{get_locales('InteractionControl')}</b>
				{this.get_interactable_objects()}
			</div>
		);
	}
}
