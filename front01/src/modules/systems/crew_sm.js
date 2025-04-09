import React from 'react';

import { send_command, get_system_state } from '../network/connections';
import { timerscounter } from '../utils/updatetimers';
import { get_locales } from '../locales/locales.js';

export class CrewControlWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mark_id: null,
			total_crew: null,
			free_crew: null,
			wounded: null,
			hospitale_cap: null,
			teams: {}
		};
	}

	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(this.proceed_data_message, 30);
		timerscounter.add(this.constructor.name, timer_id);
	}

	componentWillUnmount() {
		let timer_id = timerscounter.get(this.constructor.name);
		clearInterval(timer_id);
	}

	proceed_data_message = () => {
		let crew_data = get_system_state('crew_sm');
		let med_data = get_system_state('med_sm');

		if (med_data) {
			crew_data.wounded = med_data.hospital.units;
			crew_data.hospitale_cap = med_data.hospital.capacity;
		}

		this.setState(crew_data);
	};

	get_teams_list = () => {
		let result = [];
		for (let team_name in this.state.teams) {
			result.push(
				<RepairTeamWidget
					key={team_name}
					mark_id={this.state.mark_id}
					team_data={this.state.teams[team_name]}
				/>
			);
		}
		return result;
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<b>{get_locales('CrewControl')}</b>
				{this.state.total_crew && (
					<React.Fragment>
						<label>
							{get_locales('total_crew')}:{this.state.total_crew}
						</label>
						<label>
							{get_locales('free_crew')}:{this.state.free_crew}
						</label>
						<label>
							{get_locales('hospital')}:{this.state.wounded}/{this.state.hospitale_cap}
						</label>
						{this.get_teams_list()}
					</React.Fragment>
				)}
			</div>
		);
	}
}

export class RepairTeamWidget extends React.Component {
	onRemoveCrewMember = (e) => {
		send_command('ship.crew_sm', this.props.mark_id, 'remove_crew_from_team', {
			team_name: this.props.team_data.name
		});
	};
	onAddCrewMember = (e) => {
		send_command('ship.crew_sm', this.props.mark_id, 'add_crew_to_team', {
			team_name: this.props.team_data.name
		});
	};

	render() {
		let header;
		if (this.props.mode === 'engineer') {
			header = <b>{get_locales(this.props.team_data.name)}</b>;
		} else {
			header = (
				<span>
					<b>{get_locales(this.props.team_data.name)}: </b>
					<i>{get_locales(this.props.team_data.state)}</i>
				</span>
			);
		}

		return (
			<div className="RepairTeamWidget">
				<img src={'portraits/' + this.props.team_data.name + '.jpg'} alt="face"></img>
				<div className="RepairTeamWidget_data">
					{header}
					<progress value={this.props.team_data.loadout} max={1}></progress>
					{this.props.mode !== 'engineer' ? (
						<div>
							<button onClick={this.onRemoveCrewMember}>-</button>
							<label>{this.props.team_data.crew}/10</label>
							<button onClick={this.onAddCrewMember}>+</button>
						</div>
					) : (
						<div>
							<label>{this.props.team_data.crew}/10</label>
						</div>
					)}
				</div>
			</div>
		);
	}
}
