import React from 'react';

import { Canvas } from '@react-three/fiber';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_navdata, send_command } from '../network/connections';

import { NumericControlWidjet } from '../widgets/NumericControlWidget';

import { entityRendererCursor } from '../renderers/CursorRenderer';
import { get_brush_object } from '../renderers/CursorRenderer';
import { entityRenderer } from '../renderers/EntityRenderer';

import { global_observer_pos, set_global_observer_pos } from './AdminRadar';

import * as Const from '../utils/constants';

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
			cursor_position_old: [0, 0],
			drag_position_old: [0, 0],
			active_directions: [],
			data: {
				observer_pos: [0, 0],
				hBodies: {},
				lBodies: {},
				aZones: {}
			},
			clockwise: false
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));

		document.addEventListener('keydown', this.onKeyDown);
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
		document.removeEventListener('keydown', this.onKeyDown);
	}

	_move_observer = (x, y) => {
		let nav_data = get_navdata();
		if (!nav_data) return;

		global_observer_pos[0] = x;
		global_observer_pos[1] = y;

		nav_data.observer_pos = global_observer_pos;
		this.setState({ data: nav_data });
	};

	proceed_data_message = () => {
		this._move_observer(global_observer_pos[0], global_observer_pos[1]);
	};

	_applyNavVector = (x, y, dir) => {
		switch (dir) {
			case Const.DIR_UP:
				y += Const.OBSERVER_MOVE_STEP;
				break;
			case Const.DIR_DOWN:
				y -= Const.OBSERVER_MOVE_STEP;
				break;
			case Const.DIR_LEFT:
				x -= Const.OBSERVER_MOVE_STEP;
				break;
			case Const.DIR_RIGHT:
				x += Const.OBSERVER_MOVE_STEP;
				break;
			default:
				return [x, y];
		}

		return [x, y];
	};

	_incrementHandler = () => {
		let x = 0;
		let y = 0;
		this.state.active_directions.forEach((dir) => {
			[x, y] = this._applyNavVector(x, y, dir);
		});
		if (x !== 0 || y !== 0) this._move_observer(global_observer_pos[0] + x, global_observer_pos[1] + y);
	};

	_directionKeyHandler = (keyCode, dir) => {
		const key_timer_id = this.constructor.name + keyCode;
		if (timerscounter.get(key_timer_id)) return;
		let timerHandler = (event) => {
			if (event.keyCode === keyCode) {
				clearInterval(timerscounter.get(key_timer_id));
				timerscounter.add(key_timer_id, false);
				document.removeEventListener('keyup', timerHandler);
			}
		};

		timerscounter.add(
			key_timer_id,
			setInterval(() => {
				let active_directions = this.state.active_directions;
				if (active_directions.indexOf(dir) >= 0) return;

				const timer_id = this.constructor.name + '_increment';
				let keyupHandler = (event) => {
					if (event.keyCode === keyCode) {
						let new_directions = this.state.active_directions.filter((item) => item !== dir);
						this.setState({ active_directions: new_directions }, () => {
							if (!this.state.active_directions.length) clearInterval(timerscounter.get(timer_id));
						});

						timerscounter.add(key_timer_id, false);
						document.removeEventListener('keyup', keyupHandler);
					}
				};

				clearInterval(timerscounter.get(key_timer_id));
				active_directions.push(dir);
				this.setState({ active_directions: active_directions }, () => {
					this._incrementHandler();

					clearInterval(timerscounter.get(timer_id));
					timerscounter.add(timer_id, setInterval(this._incrementHandler, 30));
					document.addEventListener('keyup', keyupHandler);
				});
			}, 30)
		);

		document.addEventListener('keyup', timerHandler);
	};

	onKeyDown = (event) => {
		switch (event.keyCode) {
			case KeyboardEvent.DOM_VK_UP:
				this._directionKeyHandler(event.keyCode, Const.DIR_UP);
				break;
			case KeyboardEvent.DOM_VK_DOWN:
				this._directionKeyHandler(event.keyCode, Const.DIR_DOWN);
				break;
			case KeyboardEvent.DOM_VK_LEFT:
				this._directionKeyHandler(event.keyCode, Const.DIR_LEFT);
				break;
			case KeyboardEvent.DOM_VK_RIGHT:
				this._directionKeyHandler(event.keyCode, Const.DIR_RIGHT);
				break;
			default:
				return;
		}
	};

	onNavBtnDown = (event) => {
		const btn_timer_id = this.constructor.name + '_navBtn';
		let dir = event.target.dataset.dir;
		let timerHandler = () => {
			clearInterval(timerscounter.get(btn_timer_id));
			event.target.removeEventListener('mouseup', timerHandler);
			event.target.removeEventListener('mouseleave', timerHandler);
		};

		timerscounter.add(
			btn_timer_id,
			setInterval(() => {
				let active_directions = this.state.active_directions;
				if (active_directions.indexOf(dir) >= 0) return;

				const timer_id = this.constructor.name + '_increment';
				let clearHandler = () => {
					let new_directions = this.state.active_directions.filter((item) => item !== dir);
					this.setState({ active_directions: new_directions }, () => {
						if (!this.state.active_directions.length) clearInterval(timerscounter.get(timer_id));
					});

					document.removeEventListener('mouseup', clearHandler);
					event.target.removeEventListener('mouseleave', clearHandler);
				};

				timerHandler();
				active_directions.push(dir);
				this.setState({ active_directions: active_directions }, () => {
					this._incrementHandler();

					clearInterval(timerscounter.get(timer_id));
					timerscounter.add(timer_id, setInterval(this._incrementHandler, 30));
					document.addEventListener('mouseup', clearHandler);
					event.target.addEventListener('mouseleave', clearHandler);
				});
			}, 30)
		);

		event.target.addEventListener('mouseup', timerHandler);
		event.target.addEventListener('mouseleave', timerHandler);
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

	onDrag = (event) => {
		this._move_observer(
			this.state.drag_position_old[0] - event.pageX / this.state.scale_factor,
			event.pageY / this.state.scale_factor - this.state.drag_position_old[1]
		);
	};

	onStopDrag = (event) => {
		if (event.button === 1) {
			document.removeEventListener('mousemove', this.onDrag);
			document.removeEventListener('mouseup', this.onStopDrag);
		}
	};

	onStartDrag = (event) => {
		if (event.button === 1) {
			this.setState(
				{
					drag_position_old: [
						global_observer_pos[0] + event.pageX / this.state.scale_factor,
						event.pageY / this.state.scale_factor - global_observer_pos[1]
					]
				},
				() => {
					document.addEventListener('mouseup', this.onStopDrag);
					document.addEventListener('mousemove', this.onDrag);
				}
			);
		}
	};

	onMoveCursor = (mouse) => {
		let mouse_position_x =
			(mouse.x * this.state.radar_width) / 2 / this.state.scale_factor + global_observer_pos[0];
		let mouse_position_y =
			(mouse.y * this.state.radar_width) / 2 / this.state.scale_factor + global_observer_pos[1];
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
			mouse_position_x -= global_observer_pos[0];
			mouse_position_y -= global_observer_pos[1];
		}

		tmp.position = [mouse_position_x, mouse_position_y];
		return tmp;
	};

	onClickCursor = (e) => {
		if (this.props.brush_state.active) {
			let brush = this.props.brush_state.mode;
			brush = brush in brushes_map ? brushes_map[brush] : 'brush_delete';

			send_command('map_editor', 'admin', brush, this.get_brush_params(false));
		} else send_command('map_editor', 'admin', 'select_body', { mark_id: null });
	};

	get_buttons_block = () => {
		return (
			<div className="AccelerationController_btnblock">
				<button onMouseDown={this.onNavBtnDown} data-dir={Const.DIR_UP}>
					🠉
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={Const.DIR_LEFT}>
					🠈
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={Const.DIR_DOWN}>
					🠋
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={Const.DIR_RIGHT}>
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
			? entityRendererCursor.get_objects_from_data(this.onMoveCursor, this.onClickCursor)
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
					onMouseDown={this.onStartDrag}
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
						init_value={Const.INITIAL_SCALE_FACTOR}
						min={Const.MIN_SCALE_FACTOR}
						max={Const.MAX_SCALE_FACTOR}
						step={Const.STEP_SCALE_FACTOR}
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
						{get_locales('CLEAR_OFFSET')}
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
