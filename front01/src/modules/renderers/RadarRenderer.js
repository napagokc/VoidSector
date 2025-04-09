import React from 'react';

import { MeshObject, MarkerDot } from './GraphicsCoreMeshes.js';
import { Vector2 } from 'three';

const LINE_POINTS_COUNT = 25;
const ANGLE_STEP_RAD = -3.14 / (180 / 5);
const ANGLE_STEP_COUNT_MAX = 74; // from 0 to 360 + extra 2

class RadarRenderer {
	get_objects_from_data = (data, scale_factor) => {
		if (!data) return [];

		let objects_list = [];
		let scale_params = {
			scale_factor: scale_factor,
			scale_offset: data.observer_pos
		};

		for (let id in data.scan_marks) {
			objects_list = objects_list.concat(get_scanMark(data.scan_marks[id], scale_params));
		}

		return objects_list.concat(this.get_radar_shades(data, scale_factor));
	};

	get_radar_shades = (data, scale_factor) => {
		let result = [];
		let scan_radius = data.observer_radius;
		let sides = ['left', 'right', 'top', 'bottom'];
		for (let i in sides) {
			let side_name = sides[i];
			result.push(
				<RadarShadeBorder
					key={side_name}
					side={side_name}
					side_offset={scan_radius}
					scale_factor={scale_factor}
				/>
			);
		}
		result.push(<RadarCentralShade key="scan_radius" size={scan_radius} scale_factor={scale_factor} />);

		return result;
	};

	get_capmarks = (cap_marks, data, scale_factor) => {
		if (!data || !cap_marks) return [];

		let result = [];
		let scale_params = {
			scale_factor: scale_factor,
			scale_offset: data.observer_pos
		};

		for (let char in cap_marks) {
			if (cap_marks[char].active) {
				result.push(
					<CapMarkMarker
						key={char}
						char={char}
						position={cap_marks[char].position}
						scale_factor={scale_params.scale_factor}
						scale_offset={scale_params.scale_offset}
					/>
				);
			}
		}

		return result;
	};

	get_solar_flares_shades = (solar_flare_state) => {
		if (!solar_flare_state || !solar_flare_state.state) return [];

		const solar_shade_path = 'markers/solar_shades/solar_shade.png';
		return [
			<MeshObject
				texture={solar_shade_path}
				level={4}
				position={[-250, 0, 2]}
				size_array={[100, 600, 1]}
				color={0xff8000}
			/>,
			<MeshObject
				texture={solar_shade_path}
				level={4}
				position={[250, 0, 2]}
				rotation={180}
				size_array={[100, 600, 1]}
				color={0xff8000}
			/>,
			<MeshObject
				texture={solar_shade_path}
				level={4}
				position={[0, 250, 2]}
				rotation={-90}
				size_array={[100, 600, 1]}
				color={0xff8000}
			/>,
			<MeshObject
				texture={solar_shade_path}
				level={4}
				position={[0, -250, 2]}
				rotation={90}
				size_array={[100, 600, 1]}
				color={0xff8000}
			/>
		];
	};

	get_damage_shades = (state) => {
		if (!state) return [];

		return [
			<MeshObject
				texture="markers/damage_shade.png"
				level={4}
				position={[0, 0, 0]}
				size_array={[600, 600, 0.1]}
				color={0xff0000}
			/>
		];
	};
}

export const radarRenderer = new RadarRenderer();

export class CapMarkMarker extends React.Component {
	render() {
		return (
			<MeshObject
				texture={'capmarks/' + this.props.char + '.png'}
				level={3}
				position={[this.props.position[0], this.props.position[1], 2]}
				size={30}
				no_scale_size={true}
				color={0xff00dd}
				scale_factor={this.props.scale_factor}
				scale_offset={this.props.scale_offset}
			/>
		);
	}
}

let get_scanMark = (descr, scale_params) => {
	let objects = [];
	let color = 0xffffff;
	let mark_type = descr[0];
	let texture = 'markers/radar/hbody.png';

	switch (mark_type) {
		case 'pole':
			color = 0x00ffff;
			texture = 'markers/radar/pole.png';
			break;
		case 'activity':
			color = 0xff0000;
			texture = 'markers/radar/activity.png';
			break;
		case 'resource':
			color = 0x00ffff;
			texture = 'markers/radar/resource.png';
			break;
		default:
			break;
	}

	//if (descr["alias"] === "self") color = 0x00ff00
	//if (descr["alias"] === "friend") color = 0x00ffff
	//if (descr["alias"] === "enemy") color = 0xff0000

	let position = descr[1];
	objects.push(
		<MarkerRadarMark
			key={[mark_type, position ? position : '0.0'].join('_')}
			color={color}
			texture={texture}
			type={mark_type}
			position={position}
			scale_factor={scale_params.scale_factor}
			scale_offset={scale_params.scale_offset}
		></MarkerRadarMark>
	);

	return objects;
};

export class MarkerRadarMark extends React.Component {
	render() {
		return (
			<MeshObject
				texture={this.props.texture}
				level={3}
				position={[this.props.position[0], this.props.position[1], 2]}
				size={30}
				min_size={20}
				color={this.props.color}
				scale_factor={this.props.scale_factor}
				scale_offset={this.props.scale_offset}
			/>
		);
	}
}

class RadarShadeBorder extends React.Component {
	render() {
		let position = [0, 0, 2];
		switch (this.props.side) {
			case 'left':
				position[0] = -300 - this.props.side_offset * this.props.scale_factor;
				break;
			case 'right':
				position[0] = 300 + this.props.side_offset * this.props.scale_factor;
				break;
			case 'top':
				position[1] = 300 + this.props.side_offset * this.props.scale_factor;
				break;
			case 'bottom':
				position[1] = -300 - this.props.side_offset * this.props.scale_factor;
				break;
			default:
				break;
		}

		let texture = 'markers/radar_shades/radar_shade.png';
		return (
			<MeshObject
				texture={texture}
				///position={[this.props.position[0], this.props.position[1], 1]}
				position={position}
				size={600}
				color={0xffff00}
				level={2}
			/>
		);
	}
}

class RadarCentralShade extends React.Component {
	texture = 'markers/radar_shades/radar_central_shade.png';

	render() {
		let size = this.props.size * this.props.scale_factor * 2;
		if (isNaN(size)) return null;

		return (
			<MeshObject
				texture={this.texture}
				///position={[this.props.position[0], this.props.position[1], 1]}
				position={[0, 0, 1]}
				size={size}
				color={0xffffff}
				level={2}
			/>
		);
	}
}

function get_LinePoints(angle_degrees, length_from, length_to, position, scale_factor, scale_offset, index_offset) {
	let result = [];
	let step = (length_to - length_from) / LINE_POINTS_COUNT;

	let step_vector = new Vector2(step, 0);
	let center = new Vector2(0, 0);
	let angle_rad = (angle_degrees * 3.14) / 180;
	let start_point = new Vector2(length_from, 0);

	step_vector.rotateAround(center, angle_rad);
	start_point.rotateAround(center, angle_rad);

	for (let i = 0; i < LINE_POINTS_COUNT; i++) {
		result.push(
			<MarkerDot
				key={'LinePoint_' + (i + index_offset)}
				position={[
					position[0] + start_point.x + step_vector.x * i,
					position[1] + start_point.y + step_vector.y * i
				]}
				level={3}
				scale_factor={scale_factor}
				scale_offset={scale_offset}
			/>
		);
	}

	return result;
}

function get_ArcPoints(
	angle_degrees_from,
	angle_degrees_to,
	length,
	position,
	scale_factor,
	scale_offset,
	index_offset
) {
	let result = [];
	let step_vector = new Vector2(length, 0);
	let angle_rad = (angle_degrees_from * 3.14) / 180;
	let angle_step_count = ((angle_degrees_to * 3.14) / 180 - (angle_degrees_from * 3.14) / 180) / ANGLE_STEP_RAD;
	let center = new Vector2(0, 0);

	step_vector.rotateAround(center, angle_rad);

	for (let i = 0; i < angle_step_count; i++) {
		result.push(
			<MarkerDot
				key={'ArcPoint_' + (i + index_offset)}
				position={[position[0] + step_vector.x, position[1] + step_vector.y]}
				level={3}
				scale_factor={scale_factor}
				scale_offset={scale_offset}
			/>
		);
		step_vector.rotateAround(center, ANGLE_STEP_RAD);
	}

	return result;
}

export function getDistantScanArc(
	close_range,
	distant_range,
	distant_arc,
	distant_dir,
	position,
	scale_factor,
	scale_offset
) {
	let radar_pulse_interval = 2000; //[ms]
	let radar_phase = (Date.now() % radar_pulse_interval) / radar_pulse_interval;

	let angle_from = distant_dir + distant_arc / 2;
	let angle_to = distant_dir - distant_arc / 2;

	let result = get_LinePoints(angle_from, close_range, distant_range, position, scale_factor, scale_offset, 0);
	result = result.concat(
		get_LinePoints(angle_to, close_range, distant_range, position, scale_factor, scale_offset, LINE_POINTS_COUNT)
	);
	result = result.concat(get_ArcPoints(angle_from, angle_to, distant_range, position, scale_factor, scale_offset, 0));
	result = result.concat(
		get_ArcPoints(
			angle_from,
			angle_to,
			close_range + radar_phase * (distant_range - close_range),
			position,
			scale_factor,
			scale_offset,
			ANGLE_STEP_COUNT_MAX
		)
	);

	return result;
}
