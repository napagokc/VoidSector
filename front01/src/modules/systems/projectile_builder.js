import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { send_command, get_http_address, current_mark_id } from '../network/connections';

const details_list = [
	'thruster',
	'timer',
	'inhibitor',
	'explosive',
	'emp',
	'entities_detection',
	'projectiles_detection',
	'buster',
	'detonator',
	'decoy'
];

const stats_list = [
	'speed_up',
	'activation_time',
	'ttl_time',
	'explosion_radius_or_damage',
	'emp_radius',
	'ship_detection_radius',
	'projectiles_detection_radius',
	'velocity_penalty',
	'cost'
];

export class ProjectileBuilderWidget extends React.Component {
	constructor(props) {
		super(props);

		let edited_blueprints = {};
		for (let detail in details_list) edited_blueprints[details_list[detail]] = 0;

		let stats = {};
		for (let stat in stats_list) stats[stats_list[stat]] = 0;
		stats.speed_up = 1;
		stats.velocity_penalty = 1;

		this.state = {
			blueprints: {},
			edited_blueprints: edited_blueprints,
			stats: stats,
			selected: 'new_blueprint_name'
		};
	}

	update_blueprints = () => {
		var myInit = {
			method: 'GET',
			headers: {},
			'cache-control': 'no-store'
		};

		return fetch(get_http_address() + 'projectile_constructor/' + current_mark_id + '/blueprints', myInit)
			.then((response) => {
				let code = response.status;

				switch (code) {
					case 200:
						let data = response.json();
						return data;
					default:
						break;
				}
			})
			.then((data) => {
				this.setState({
					blueprints: data
				});
			})
			.catch((error) => {});
	};

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.update_blueprints, 1000));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	onComponentChange = (comp_name, step) => {
		let value = this.state.edited_blueprints[comp_name] + step;
		if (value < 0) return;

		let tmp_bp = this.state.edited_blueprints;
		tmp_bp[comp_name] = value;

		this.setState({ edited_blueprints: tmp_bp }, this.updateStats);
	};

	updateStats = () => {
		var myInit = {
			method: 'GET',
			headers: {
				blueprint: JSON.stringify(this.state.edited_blueprints)
			},
			'cache-control': 'no-store'
		};

		return fetch(get_http_address() + '/projectile_constructor/stats', myInit)
			.then((response) => {
				let code = response.status;

				switch (code) {
					case 200:
						let data = response.json();
						return data;
					default:
						break;
				}
			})
			.then((data) => {
				this.setState({
					stats: data
				});
			})
			.catch((error) => {});
	};

	get_components_selector = () => {
		let result = [];
		for (let i in details_list) {
			let comp_name = details_list[i];
			result.push(
				<div key={comp_name} className="component_controller">
					<label>{get_locales(comp_name)}</label>
					<button
						onClick={(e) => {
							this.onComponentChange(comp_name, -1);
						}}
					>
						-
					</button>
					<label>{this.state.edited_blueprints[comp_name]}</label>
					<button
						onClick={(e) => {
							this.onComponentChange(comp_name, +1);
						}}
					>
						+
					</button>
				</div>
			);
		}

		return <div className="components_selector">{result}</div>;
	};

	get_stats_panel = () => {
		let result = [];
		for (let i in stats_list) {
			let stat_name = stats_list[i];
			result.push(
				<div key={stat_name} className="component_controller">
					<label>
						{get_locales(stat_name)}:{this.state.stats[stat_name]}
					</label>
				</div>
			);
		}

		return <div className="components_selector">{result}</div>;
	};

	onLoadSelected = (bp_name) => {
		let tmp_bp = Object.assign({}, this.state.blueprints[bp_name]);
		this.setState({ selected: bp_name, edited_blueprints: tmp_bp }, this.updateStats);
	};

	onSaveCurrent = () => {
		send_command('ship.resources_sm', current_mark_id, 'save_projectile_blueprint', {
			bp_name: this.state.selected,
			bp_content: this.state.edited_blueprints
		});
		let tmp_bps = this.state.blueprints;
		tmp_bps[this.state.selected] = this.state.edited_blueprints;

		this.setState({ blueprints: tmp_bps });
	};

	onDeleteCurrent = () => {
		send_command('ship.resources_sm', current_mark_id, 'delete_projectile_blueprint', {
			bp_name: this.state.selected
		});
		let tmp_bps = this.state.blueprints;
		delete tmp_bps[this.state.selected];

		this.setState({ blueprints: tmp_bps });
	};

	get_saveload_panel = () => {
		let blueprints = [];
		for (let bp_name in this.state.blueprints) {
			blueprints.push(
				<label
					key={bp_name}
					className={this.state.selected === bp_name ? 'selected' : ''}
					onClick={() => {
						this.onLoadSelected(bp_name);
					}}
				>
					{bp_name}
				</label>
			);
		}

		return (
			<div className="FileLoader">
				<div className="map_selector">{blueprints} </div>
				<input
					onChange={(e) => {
						if (e.target.value.length < 20) {
							this.setState({ selected: e.target.value });
						}
					}}
					value={this.state.selected}
				></input>
				<button onClick={this.onSaveCurrent}>{get_locales('SAVE')}</button>
				<button onClick={this.onDeleteCurrent}>{get_locales('DELETE')}</button>
			</div>
		);
	};

	render() {
		return (
			<div className="SystemControlWidget">
				<label>
					<b>{get_locales('Projectile constructor')}</b>
				</label>
				<div className="ProjectileBuilderWidget">
					{this.get_saveload_panel()}
					<div className="DesignSection">
						{this.get_components_selector()}
						{this.get_stats_panel()}
					</div>
				</div>
			</div>
		);
	}
}
