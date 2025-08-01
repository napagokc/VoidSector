import React, { useRef } from 'react';

import { Canvas, useLoader } from '@react-three/fiber';

import { TextureLoader } from 'three/src/loaders/TextureLoader';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_system_state, send_command } from '../network/connections';

import { RadarControlWidget } from '../systems/radar_sm';
import { EnergyControlWidget } from '../systems/energy_sm';

export class EngineerControllerWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected_sm: null
		};
	}

	render() {
		return (
			<div className="EngineerControllerWidget">
				<div className="OverviewWidget">
					<ShipOvervieweWidget
						onSystemSelection={(sm_name) => this.setState({ selected_sm: sm_name })}
						selected_sm={this.state.selected_sm}
					/>
					<SystemOvervieweWidget role={this.props.role} sm_name={this.state.selected_sm} />
				</div>
				<div className="EngineerSystemsLayer">
					<EnergyControlWidget />
					<RadarControlWidget />
				</div>
			</div>
		);
	}
}

export class ShipOvervieweWidget extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		this.setState(get_system_state('damage_sm'));
	};

	proceed_system_selection = (sm_name) => {
		if (['cone_sm', 'hull_sm'].includes(sm_name)) return;
		this.props.onSystemSelection(sm_name);
	};

	get_hp_color = (sm_name) => {
		if (!this.state?.systems_hp || !(sm_name in this.state.systems_hp)) {
			return 0xffffff;
		}

		let perc_hp = this.state.systems_hp[sm_name].current_hp / this.state.systems_hp[sm_name].max_hp;
		if (perc_hp < 1) {
			let perc_hp_step = 0.2;
			perc_hp = perc_hp - (perc_hp % perc_hp_step);
			perc_hp = perc_hp * 0.5;
		}

		let R = 255 - (255 * (perc_hp - 0.5)) / 0.5;
		let G = 255;
		if (perc_hp < 0.5) {
			R = 255;
			G = (255 * perc_hp) / 0.5;
		}

		return Number('0x' + this.format2leading_zero_hex(R) + this.format2leading_zero_hex(G) + '00');
	};

	format2leading_zero_hex = (value) => {
		let res = Math.round(value).toString(16);
		if (res.length === 1) res = '0' + res;

		return res;
	};

	render() {
		let objects = [];
		for (let sp_name in ship_parts_render_params) {
			objects.push(
				<ShipsPartMesh
					key={sp_name}
					part_name={sp_name}
					onClick={(e) => {
						this.proceed_system_selection(sp_name + '_sm');
					}}
					color={this.get_hp_color(sp_name + '_sm')}
				></ShipsPartMesh>
			);
		}

		if (this.props.selected_sm) {
			objects.push(
				<ShipsPartMesh
					key="selected_sm"
					part_name={this.props.selected_sm.split('_')[0]}
					selected={true}
					onClick={(e) => {}}
					//color = {0x00ffff}
				></ShipsPartMesh>
			);
		}

		return (
			<div className="ShipOvervieweWidget">
				<div className="ShipSection">
					<Canvas id="ShipCanvas" orthographic={true} style={{ width: '300px', height: '200px' }}>
						<ambientLight />
						{objects}
					</Canvas>
				</div>
			</div>
		);
	}
}

const ship_scaling_factor = 0.25;
const ship_offsetX_factor = -40;

const ship_parts_render_params = {
	hull: {
		pos: [0, 0, 0],
		size: [530, 303, 1]
	},
	cone: {
		pos: [112, 0, 0],
		size: [341, 266, 1]
	},

	radar: {
		pos: [8, 55, 0],
		size: [231, 118, 1]
	},
	engine: {
		pos: [-65, 0, 0],
		size: [239, 246, 1]
	},
	energy: {
		pos: [5, 0, 0],
		size: [208, 208, 1]
	}
};

export function ShipsPartMesh(props) {
	let texture_name = 'ship/' + props.part_name + '.png';
	if (props.selected) texture_name = 'ship/' + props.part_name + '_selected.png';
	const texture = useLoader(TextureLoader, texture_name);

	//const texture = useLoader(TextureLoader, 'markers/crosschair.png')
	const meshRef = useRef();
	let geometry = [
		ship_parts_render_params[props.part_name].size[0],
		ship_parts_render_params[props.part_name].size[1],
		ship_parts_render_params[props.part_name].size[2]
	];

	geometry[0] = geometry[0] * ship_scaling_factor;
	geometry[1] = geometry[1] * ship_scaling_factor;

	let position = [
		ship_parts_render_params[props.part_name].pos[0],
		ship_parts_render_params[props.part_name].pos[1],
		ship_parts_render_params[props.part_name].pos[2]
	];
	position[0] = position[0] + ship_offsetX_factor;

	// Subscribe this component to the render-loop, rotate the mesh every frame

	return (
		<mesh {...props} ref={meshRef} position={position} onClick={(event) => props.onClick()}>
			<boxGeometry args={geometry} />
			<meshStandardMaterial map={texture} color={props.color ? props.color : 0xffffff} transparent={true} />
		</mesh>
	);
}

export class SystemOvervieweWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			sm_name: null,
			mark_id: null,
			current_hp: null,
			max_hp: null,
			current_team: null,
			upgrade_level: null,
			upgrade_cost: null,
			teams: {}
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
		if (!this.props.sm_name) return;

		let damage_sm = get_system_state('damage_sm');
		if (!damage_sm) return;

		let sm_name = this.props.sm_name;
		let upgrade_sm = get_system_state('RnD_sm');
		let sm_info = get_system_state(sm_name);

		this.setState({
			sm_name: sm_name,
			mark_id: damage_sm.mark_id,
			current_hp: damage_sm.systems_hp[this.props.sm_name].current_hp.toFixed(1),
			max_hp: damage_sm.systems_hp[this.props.sm_name].max_hp,
			upgrade_level: sm_info.upgrade_level,
			upgrade_cost: upgrade_sm.systems_upgrades[this.props.sm_name].cost[sm_info.upgrade_level],
		});
	};

	on_system_upgrade = (e) => {
		send_command('ship.RnD_sm', this.state.mark_id, 'upgrade_system', { system: this.state.sm_name });
	};

	render() {
		//if (!this.state.current_hp === undefined) return (<div></div>)

		return (
			<div className="SystemOvervieweWidget">
				<b>{get_locales(this.props.sm_name)}</b>
				<label>
					{get_locales('hp')}: {this.state.current_hp}/{this.state.max_hp}
				</label>
				<label>
					{get_locales('upgrade_level')}: {this.state.upgrade_level}
				</label>
			</div>
		);
	}
}
