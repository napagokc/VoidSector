import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_capmarks, get_observer_id, send_command } from '../network/connections';

export class CapMarksControlWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: {},
			mark_id: null
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
		let data = get_capmarks('radar_sm');
		if (data) this.setState({ data: data, mark_id: get_observer_id() });
	};

	onSelect = (char) => {
		send_command('ship.cap_marks', this.state.mark_id, 'select_point', { char: char });
	};

	onDeactivate = (char) => {
		send_command('ship.cap_marks', this.state.mark_id, 'deactivate_point', { char: char });
	};

	get_capmark_control = (char) => {
		let mark = this.state.data[char];

		return (
			<tr key={char}>
				<td>{char}</td>
				<td>{mark.active ? mark.position.join(', ') : '-'}</td>
				<td>{mark.active ? get_locales('is_set') : get_locales('not_set')}</td>
				<td>
					<button onClick={(e) => this.onSelect(char)}>
						{get_locales('aсtivate')}
					</button>
				</td>
				<td>
					<button onClick={(e) => this.onDeactivate(char)}>
						{get_locales('deaсtivate')}
					</button>
				</td>
			</tr>
		);
	};

	get_capmarks_table = () => {
		let result = [];
		for (let char in this.state.data) {
			result.push(this.get_capmark_control(char));
		}

		return (
			<table>
				<thead>
					<tr>
						<th>{get_locales('MarkLetter')}</th>
						<th>{get_locales('Position')}</th>
						<th>{get_locales('Status')}</th>
						<th width={100}></th>
						<th width={100}></th>
					</tr>
				</thead>
				<tbody>{result}</tbody>
			</table>
		);
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>{get_locales('CapPointsController')}</b>
				{this.get_capmarks_table()}
			</div>
		);
	}
}
