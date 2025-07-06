import React from 'react';

import { Canvas } from '@react-three/fiber';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_navdata, send_command } from '../network/connections';

import { NumericControlWidjet } from '../widgets/NumericControlWidget';

import { entityRendererCursor } from '../renderers/CursorRenderer';
import { get_brush_object } from '../renderers/CursorRenderer';
import { entityRenderer } from '../renderers/EntityRenderer';

import { INITIAL_SCALE_FACTOR, MIN_SCALE_FACTOR, MAX_SCALE_FACTOR, STEP_SCALE_FACTOR } from './PlayerRadar';
import { global_observer_pos, set_global_observer_pos } from './AdminRadar';

const brushes_map = {
	creator: 'brush_create',
	deleter: 'brush_delete',
	cacher: 'brush_cache',
	uncacher: 'brush_uncache',
	selector: 'brush_select_body',
	obstacles_creator: 'brush_spawn_obstacles',
	obstacles_deleter: 'brush_delete_obstacles',
	brush_weight_editor: 'brush_edit_weight'
};

export class MapEditorRadarWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			radar_width: 600,
			scale_factor: 1,
			radar_hover: false,
			controlled_observer_pos: [0, 0],
			cursor_position_old: [0, 0],
			data: {
				observer_pos: [0, 0],
				hBodies: {},
				lBodies: {},
				aZones: {}
			},
			key_pressed: [0, 0],
			clockwise: false
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
		let nav_data = get_navdata();
		if (!nav_data) return;

		let o = global_observer_pos; //this.state.controlled_observer_pos
		o[0] = o[0] + this.state.key_pressed[0];
		o[1] = o[1] + this.state.key_pressed[1];

		nav_data.observer_pos = o;

		this.setState({
			data: nav_data,
			controlled_observer_pos: o
		});
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

	onMouseEnter = () => {
		this.setState({ radar_hover: true });
	};

	onMouseLeave = () => {
		this.setState({ radar_hover: false });
	};

	onMouseWheel = (event) => {
		let new_scale_factor = this.state.scale_factor + STEP_SCALE_FACTOR * (event.deltaY > 0 ? -3 : 3);
		new_scale_factor = Math.min(Math.max(MIN_SCALE_FACTOR, new_scale_factor), MAX_SCALE_FACTOR);
		this.setState({ scale_factor: +new_scale_factor.toFixed(2) });
	};

	onMouseMove = (mouse) => {
		let mouse_position_x =
			(mouse.x * this.state.radar_width) / 2 / this.state.scale_factor + this.state.controlled_observer_pos[0];
		let mouse_position_y =
			(mouse.y * this.state.radar_width) / 2 / this.state.scale_factor + this.state.controlled_observer_pos[1];
		let cursor_position = [mouse_position_x, mouse_position_y];

		if (
			this.state.cursor_position_old[0] !== mouse_position_x &&
			this.state.cursor_position_old[1] !== mouse_position_y
		) {
			this.setState({ cursor_position_old: cursor_position });
			send_command('map_editor', 'marl_id', 'cursor_move', {
				position: [mouse_position_x, mouse_position_y],
				clockwise: this.state.clockwise
			});
		}
	};

	get_brush_params = (to_draw) => {
		let tmp = Object.assign({}, this.props.brush_state);
		let mouse_position_x = this.state.cursor_position_old[0];
		let mouse_position_y = this.state.cursor_position_old[1];

		if (to_draw) {
			mouse_position_x = mouse_position_x - this.state.controlled_observer_pos[0];
			mouse_position_y = mouse_position_y - this.state.controlled_observer_pos[1];
		}

		tmp.position = [mouse_position_x, mouse_position_y];
		return tmp;
	};

	onMouseClick = (e) => {
		if (this.props.brush_state.active) {
			let brush = this.props.brush_state.mode;
			brush = brush in brushes_map ? brushes_map[brush] : 'brush_delete';

			send_command('map_editor', 'admin', brush, this.get_brush_params(false));
		} else send_command('map_editor', 'admin', 'select_body', { mark_id: null });
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

	get_cursor_position = () => {
		let offset = this.state.cursor_position_old;

		//let mouse_position_x = (this.state.cursor_position_old[0] * this.state.radar_width / 2) / this.state.scale_factor + offset[0]
		//let mouse_position_y = (this.state.cursor_position_old[1] * this.state.radar_width / 2) / this.state.scale_factor + offset[1]

		//let position = [Math.round(mouse_position_x, 2), Math.round(mouse_position_y, 2)]
		return offset;
	};

	render() {
		let objects = entityRenderer.get_objects_from_data(this.state.data, this.state.scale_factor, {
			show_gravity: true
		});
		let selection_objects = entityRenderer.get_selection_marker(
			this.state.data,
			this.state.scale_factor,
			this.props.selected_body_idx
		);
		let highlighted_objects = entityRenderer.get_selection_marker(
			this.state.data,
			this.state.scale_factor,
			this.props.highlighted_body_idx
		);
		let aim_markers = this.state.radar_hover
			? entityRendererCursor.get_objects_from_data(this.onMouseMove, this.onMouseClick)
			: [];
		let brush_objects = get_brush_object(this.get_brush_params(true), this.state.scale_factor);

		let cursor_position = this.get_cursor_position();

		return (
			<div className="AdminRadarSection">
				<Canvas
					orthographic={true}
					onMouseEnter={this.onMouseEnter}
					onMouseLeave={this.onMouseLeave}
					onWheel={this.onMouseWheel}
					style={{ width: this.state.radar_width, height: this.state.radar_width }}
				>
					<ambientLight />
					{objects}
					{aim_markers}
					{selection_objects}
					{highlighted_objects}
					{brush_objects}
				</Canvas>

				<div className="flex flex_space_between">
					<NumericControlWidjet
						label="SCALE"
						init_value={INITIAL_SCALE_FACTOR}
						min={MIN_SCALE_FACTOR}
						max={MAX_SCALE_FACTOR}
						step={STEP_SCALE_FACTOR}
						value={this.state.scale_factor}
						onChange={(value) => this.setState({ scale_factor: value })}
					/>
					{this.get_buttons_block()}
					<button
						onClick={() => {
							set_global_observer_pos([0, 0]);
							this.proceed_data_message();
						}}
					>
						CLEAR OFFSET
					</button>
				</div>
				<label>
					Clockwise:
					<input
						type="checkbox"
						value={this.state.clockwise}
						onChange={(e) => {
							this.setState({ clockwise: e.target.checked });
						}}
					></input>
				</label>
				<label>
					{get_locales('CURSOR_POS')}: {cursor_position[0].toFixed(0)},{cursor_position[1].toFixed(0)}
				</label>
			</div>
		);
	}
}
