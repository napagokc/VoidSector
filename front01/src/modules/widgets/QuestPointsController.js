import React from 'react';

import { timerscounter } from '../utils/updatetimers';

import { send_command, get_observer_id, get_http_address } from '../network/connections';

export class QuestPointsController extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 1000));

		this.proceed_data_message();
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		return fetch(get_http_address() + '/quest_controller/get_state', { method: 'GET' })
			.then((response) => {
				if (response.status === 200) return response.json();
			})
			.then((data) => {
				if (data) this.setState(data);
			})
			.catch((e) => {});
	};

	toogle_qp_state = (qp_name) => {
		send_command('qp_controller', get_observer_id, 'toogle_qp_state', { qp_name: qp_name });
	};

	get_quest_point_list = () => {
		let result = [];
		for (let qp_name in this.state) {
			result.push(
				<div key={qp_name}>
					{qp_name}: {this.state[qp_name].toString()}{' '}
					<button
						onClick={(e) => {
							this.toogle_qp_state(qp_name);
						}}
					>
						toogle_state
					</button>
				</div>
			);
		}

		return <div>{result}</div>;
	};

	render() {
		return <div className="SystemControlWidget">{this.get_quest_point_list()}</div>;
	}
}
