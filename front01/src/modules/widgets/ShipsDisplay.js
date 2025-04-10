import React from 'react';

import { timerscounter } from '../utils/updatetimers';

import { get_ships_state, get_stations_state, send_command } from '../network/connections';

import { set_global_observer_pos } from './AdminRadar';

class ShipCard extends React.Component {
	get_RnD_block = () => {
		let result = [];
		for (let system_name in this.props.data.RnD) {
			result.push(
				<label key={system_name}>
					{system_name}:{this.props.data.RnD[system_name]}
				</label>
			);
		}
		return <div>{result}</div>;
	};

	take_control = (key) => {
		send_command('connection', key, 'take_control_on_entity', { target_id: key });
		//this.props.on_ship_selected(key)
		if (key && this.props.selectModule) this.props.selectModule('NPC_pilot');
	};

	move_view = (key) => {
		set_global_observer_pos(this.props.data.pos);
	};

	get_HP_block = () => {
		return <div>hp:{this.props.data.hp}</div>;
	};

	render() {
		return (
			<div className="ShipCard">
				<b>{this.props.mark_id}</b>
				{this.get_HP_block()}
				{this.get_RnD_block()}
				<button
					onClick={(e) => {
						this.take_control(this.props.mark_id);
					}}
				>
					take control
				</button>
				<button
					onClick={(e) => {
						this.move_view(this.props.mark_id);
					}}
				>
					move view
				</button>
			</div>
		);
	}
}

export class ShipsDisplay extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		this.setState(get_ships_state());
	};

	get_shipCards_block = () => {
		let result = [];
		for (let mark_id in this.state) {
			result.push(
				<ShipCard
					key={mark_id}
					selectModule={this.props.selectModule}
					mark_id={mark_id}
					data={this.state[mark_id]}
				></ShipCard>
			);
		}
		return result;
	};

	render() {
		let ships_card = this.get_shipCards_block();
		return <div className="ShipsDisplay">{ships_card}</div>;
	}
}

class StationCard extends React.Component {
	get_RnD_block = () => {
		let result = [];
		for (let system_name in this.props.data.RnD) {
			result.push(
				<label key={system_name}>
					{system_name}:{this.props.data.RnD[system_name]}
				</label>
			);
		}

		return <div>{result}</div>;
	};

	activate_defence = () => {
		send_command(
			'station_controller',
			this.props.mark_id,
			'activate_station_defence',
			{ target: this.props.mark_id },
			true
		);
	};

	move_view = (key) => {
		set_global_observer_pos(this.props.data.pos);
	};

	destroy = () => {
		send_command('station_controller', this.props.mark_id, 'destroy_station', { target: this.props.mark_id }, true);
	};

	get_stats_block = () => {
		return (
			<div className="flex flex_column">
				<label>hp: {this.props.data.hp}</label>
				<label>
					pos: {this.props.data.pos[0]}, {this.props.data.pos[1]}
				</label>
			</div>
		);
	};

	render() {
		return (
			<div className="ShipCard">
				<b>{this.props.mark_id}</b>
				{this.get_stats_block()}
				<button
					onClick={(e) => {
						this.move_view(this.props.mark_id);
					}}
				>
					move view
				</button>
				<button
					onClick={(e) => {
						this.activate_defence();
					}}
				>
					activate defence
				</button>
				<button
					onClick={(e) => {
						this.destroy();
					}}
				>
					destroy
				</button>
			</div>
		);
	}
}

export class StationsDisplay extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		this.setState(get_stations_state());
	};

	get_shipCards_block = () => {
		let result = [];
		for (let mark_id in this.state) {
			result.push(<StationCard key={mark_id} mark_id={mark_id} data={this.state[mark_id]}></StationCard>);
		}

		return result;
	};

	render() {
		let ships_card = this.get_shipCards_block();
		return <div className="ShipsDisplay">{ships_card}</div>;
	}
}
