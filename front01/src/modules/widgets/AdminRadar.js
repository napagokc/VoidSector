import React from 'react';

import { get_navdata, get_solarflare, get_map_border } from '../network/connections';

import { Canvas } from '@react-three/fiber';

import { entityRenderer } from '../renderers/EntityRenderer';
import { entityRendererCursor } from '../renderers/CursorRenderer';
import { timerscounter } from '../utils/updatetimers';
import { radarRenderer } from '../renderers/RadarRenderer';
import { get_locales } from '../locales/locales';

export let global_observer_pos = [0, 0];

export function set_global_observer_pos(value) {
	global_observer_pos = value;
}

export class AdminRadarWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			radar_width: 600,
			scale_factor: 1,
			controlled_observer_pos: [0, 0],
			data: {
				observer_pos: [0, 0],
				hBodies: {},
				lBodies: {},
				aZones: {}
			},
			entity_hovered: '',
			key_pressed: [0, 0],
			show_id_labels: true
		};
	}

	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(this.proceed_data_message, 30);
		timerscounter.add(this.constructor.name, timer_id);

		let tmp_data = this.state.data;
		tmp_data.observer_pos = global_observer_pos;

		this.setState({ data: tmp_data });
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	proceed_data_message = () => {
		let nav_data = get_navdata();
		if (nav_data == null) return;

		let o = global_observer_pos; //this.state.controlled_observer_pos
		o[0] = o[0] + this.state.key_pressed[0];
		o[1] = o[1] + this.state.key_pressed[1];

		nav_data.observer_pos = o;

		this.setState({ data: nav_data });
	};

	set_entity_hovered = (s) => {
		this.setState({ entity_hovered: s });
	};

	move_observer = (axis, step) => {
		let o = this.state.controlled_observer_pos;
		if (axis === 'X') o[0] = o[0] + step;
		if (axis === 'Y') o[1] = o[1] + step;

		this.setState({ controlled_observer_pos: o });
	};

	move_observer_step = (params) => {
		this.setState({ key_pressed: params });
	};

	onMouseMove = (mouse) => {
		/*if ((mouse.x < treshhold_out) && (mouse.x > -treshhold_out)) {
         if (mouse.x > treshhold_in) this.move_observer("X", step)
         if (mouse.x < -treshhold_in) this.move_observer("X", -step)
        }
        if ((mouse.y < treshhold_out) && (mouse.y > -treshhold_out)) {
         if (mouse.y > treshhold_in) this.move_observer("Y", step)
         if (mouse.y < -treshhold_in) this.move_observer("Y", -step)
        }*/
	};

	get_buttons_block = () => {
		let step = 20;
		return (
			<div className="AccelerationController_btnblock">
				<button
					onMouseUp={(e) => {
						this.move_observer_step([0, 0]);
					}}
					onMouseDown={(e) => {
						this.move_observer_step([0, step]);
					}}
				>
					🠉
				</button>

				<button
					onMouseUp={(e) => {
						this.move_observer_step([0, 0]);
					}}
					onMouseDown={(e) => {
						this.move_observer_step([-step, 0]);
					}}
				>
					🠈
				</button>
				<button
					onMouseUp={(e) => {
						this.move_observer_step([0, 0]);
					}}
					onMouseDown={(e) => {
						this.move_observer_step([0, -step]);
					}}
				>
					🠋
				</button>
				<button
					onMouseUp={(e) => {
						this.move_observer_step([0, 0]);
					}}
					onMouseDown={(e) => {
						this.move_observer_step([step, 0]);
					}}
				>
					🠊
				</button>
			</div>
		);
	};

	render() {
		let objects = entityRenderer.get_objects_from_data(this.state.data, this.state.scale_factor, {
			show_id_labels: this.state.show_id_labels,
			map_border: get_map_border()
		});
		let aim_markers = entityRendererCursor.get_objects_from_data(this.onMouseMove, (e) => {});
		let selection_objects = entityRenderer.get_selection_marker(
			this.state.data,
			this.state.scale_factor,
			this.state.entity_hovered
		);
		let solar_flares = radarRenderer.get_solar_flares_shades(get_solarflare());

		return (
			<div className="PlayersRadar">
				<div className="radarSection">
					<Canvas
						orthographic={true}
						style={{ width: this.state.radar_width, height: this.state.radar_width }}
					>
						<ambientLight />
						{objects}
						{aim_markers}
						{selection_objects}
						{solar_flares}
					</Canvas>

					<div className="flex flex_space_between">
						<label>
							SCALE:{' '}
							<input
								type="range"
								min={0.1}
								max={2}
								step={0.02}
								className="slider"
								id="valueForward"
								value={this.state.scale_factor}
								onChange={(e) => {
									this.setState({ scale_factor: e.target.value });
								}}
								//value={this.state.progradeAcc}
							/>
						</label>
						{parseFloat(this.state.scale_factor).toFixed(2)}
						{this.get_buttons_block()}
						<button
							onClick={() => {
								this.setState({ controlled_observer_pos: [0, 0] });
							}}
						>
							CLEAR OFFSET
						</button>
						<label>
							{get_locales('toogle_id_labels')}
							<input
								type="checkbox"
								checked={this.state.show_id_labels}
								onChange={(e) => {
									this.setState({ show_id_labels: e.target.checked });
								}}
							></input>
						</label>
					</div>
				</div>
			</div>
		);
	}
}
