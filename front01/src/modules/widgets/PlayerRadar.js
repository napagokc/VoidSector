import React from 'react';

import { Canvas } from '@react-three/fiber';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import {
	send_command,
	get_navdata,
	get_capmarks,
	get_solarflare,
	is_taking_damage,
	get_map_border
} from '../network/connections';

import { NumericControlWidjet } from '../widgets/NumericControlWidget';

import { entityRenderer } from '../renderers/EntityRenderer';
import { radarRenderer } from '../renderers/RadarRenderer';
import { entityRendererCursor } from '../renderers/CursorRenderer';

import { ShipOvervieweWidget } from './ShipOverview';

import * as Const from '../utils/constants';

export class PlayersRadarWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			scale_factor: 1,
			radar_width: 600,
			radar_hover: false,
			data: {
				mark_id: '',
				observer_pos: [0, 0]
			},
			entity_hovered: '',
			mouse_pos: [0, 0],
			show_id_labels: true
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
		this.setState({ data: get_navdata(), cap_marks: get_capmarks() });
	};

	onMouseEnter = () => {
		this.setState({ radar_hover: true });
	};

	onMouseLeave = () => {
		this.setState({ radar_hover: false });
	};

	onMouseWheel = (event) => {
		let new_scale_factor = this.state.scale_factor + Const.STEP_SCALE_FACTOR * (event.deltaY > 0 ? -3 : 3);
		new_scale_factor = Math.min(Math.max(Const.MIN_SCALE_FACTOR, new_scale_factor), Const.MAX_SCALE_FACTOR);
		this.setState({ scale_factor: +new_scale_factor.toFixed(2) });
	};

	onMouseMove = (mouse) => {
		if (!this.state.data) return;

		if (this.state.mouse_pos[0] !== mouse.x && this.state.mouse_pos[0] !== mouse.y) {
			this.setState({ mouse_pos: [mouse.x, mouse.y] });

			if (!this.props.can_aim) return;

			send_command('ship.launcher_sm', this.state.data.mark_id, 'aim', {
				vel_angle: mouse.angle() * 180 / Math.PI,
				vel_scalar: Math.min(mouse.length(), 1)
			});
		}
	};

	onMouseClick = () => {
		if (this.props.cap_control) this.onSetMark();
	};

	onSetMark = () => {
		let offset = this.state.data.observer_pos;
		let mouse_position_x =
			(this.state.mouse_pos[0] * this.state.radar_width) / 2 / this.state.scale_factor + offset[0];
		let mouse_position_y =
			(this.state.mouse_pos[1] * this.state.radar_width) / 2 / this.state.scale_factor + offset[1];
		let position = [Math.round(mouse_position_x, 2), Math.round(mouse_position_y, 2)];

		send_command('ship.cap_marks', this.state.data.mark_id, 'make_point', { position: position });
	};

	get_cursor_position = () => {
		if (!this.state.data) return [0, 0];

		let offset = this.state.data.observer_pos;
		let mouse_position_x =
			(this.state.mouse_pos[0] * this.state.radar_width) / 2 / this.state.scale_factor + offset[0];
		let mouse_position_y =
			(this.state.mouse_pos[1] * this.state.radar_width) / 2 / this.state.scale_factor + offset[1];
		let position = [Math.round(mouse_position_x, 2), Math.round(mouse_position_y, 2)];

		return position;
	};

	get_solar_flare_timer = () => {
		let solar_flare_state = get_solarflare();
		if (!solar_flare_state) return;

		if (solar_flare_state.state) {
			return (
				<label className="sf_active">
					{get_locales('time_to_next_sf_phase')}: {solar_flare_state.time2nextphase}
				</label>
			);
		} else if (solar_flare_state.timer_state) {
			return (
				<label className="sf_active">
					{get_locales('time_to_flare')}: {solar_flare_state.time2nextphase}
				</label>
			);
		} else {
			return (
				<label className={solar_flare_state.probability === 'high' ? 'sf_high' : 'sf_low'}>
					{get_locales('sf_probability')}: {get_locales(solar_flare_state.probability)}
				</label>
			);
		}
	};

	render() {
		let aim_markers = this.state.radar_hover
			? entityRendererCursor.get_objects_from_data(this.onMouseMove, this.onMouseClick)
			: [];
		let cap_markers = radarRenderer.get_capmarks(this.state.cap_marks, this.state.data, this.state.scale_factor);
		let scan_markers = radarRenderer.get_objects_from_data(this.state.data, this.state.scale_factor);
		let objects = entityRenderer.get_objects_from_data(this.state.data, this.state.scale_factor, {
			show_id_labels: this.state.show_id_labels,
			arrow_scaling: this.props.arrow_scaling,
			map_border: get_map_border()
		});
		let selection_objects = entityRenderer.get_selection_marker(
			this.state.data,
			this.state.scale_factor,
			this.state.entity_hovered
		);
		let solar_flares = radarRenderer.get_solar_flares_shades(get_solarflare());
		let damage_shades = radarRenderer.get_damage_shades(is_taking_damage());
		//if (scan_params) radar_arcs= getDistantScanArc(scan_params.close_range, scan_params.distant_range, scan_params.distant_arc, scan_params.distant_dir, [0,0], this.state.scale_factor)
		let cursor_position = this.get_cursor_position();
		let observer_pos = this.state.data ? this.state.data.observer_pos : [0.0, 0.0];

		return (
			<div className="PlayersRadar">
				<div className="radarSection">
					<Canvas
						orthographic={true}
						onMouseEnter={this.onMouseEnter}
						onMouseLeave={this.onMouseLeave}
						onWheel={this.onMouseWheel}
						style={{ width: this.state.radar_width, height: this.state.radar_width }}
					>
						<ambientLight />
						{aim_markers}
						{objects}
						{scan_markers}
						{selection_objects}
						{cap_markers}
						{solar_flares}
						{damage_shades}
					</Canvas>
					<div className="RadarShipInfoLayer">
						<ShipOvervieweWidget onSystemSelection={(e) => {}}></ShipOvervieweWidget>
						<div className="ShipNavigationInfo">
							<NumericControlWidjet
								label="SCALE"
								init_value={Const.INITIAL_SCALE_FACTOR}
								min={Const.MIN_SCALE_FACTOR}
								max={Const.MAX_SCALE_FACTOR}
								step={Const.STEP_SCALE_FACTOR}
								value={this.state.scale_factor}
								onChange={(value) => this.setState({ scale_factor: value })}
							/>
							<label>
								{get_locales('POS')}: {observer_pos[0].toFixed(0)},{observer_pos[1].toFixed(0)}
							</label>
							<label>
								{get_locales('CURSOR_POS')}: {cursor_position[0].toFixed(0)},
								{cursor_position[1].toFixed(0)}
							</label>
							{this.get_solar_flare_timer()}
						</div>
					</div>
				</div>
			</div>
		);
	}
}
