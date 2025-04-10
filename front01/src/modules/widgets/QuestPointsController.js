import React from 'react';

import { send_command, get_observer_id, get_http_address } from '../network/connections';
import { timerscounter } from '../utils/updatetimers';

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
		let message_code = 0;
		return fetch(get_http_address() + '/quest_controller/get_state', { method: 'GET' })
			.then((response) => {
				message_code = response.status;
				return response.json();
			})
			.then((data) => {
				if (message_code == 200) this.setState(data);
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
