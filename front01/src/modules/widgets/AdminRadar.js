import React from 'react';

import { Canvas } from '@react-three/fiber';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_navdata, get_solarflare, get_map_border } from '../network/connections';

import { NumericControlWidjet } from '../widgets/NumericControlWidget';

import { entityRendererCursor } from '../renderers/CursorRenderer';
import { entityRenderer } from '../renderers/EntityRenderer';
import { radarRenderer } from '../renderers/RadarRenderer';

import * as Const from '../utils/constants';

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
			radar_hover: false,
			drag_position_old: [0, 0],
			active_directions: [],
			data: {
				observer_pos: [0, 0],
				hBodies: {},
				lBodies: {},
				aZones: {}
			},
			entity_hovered: '',
			show_id_labels: true
		};
	}

	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.proceed_data_message, 30));

		let tmp_data = this.state.data;
		tmp_data.observer_pos = global_observer_pos;

		this.setState({ data: tmp_data });

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
		let nav_data = get_navdata();
		if (!nav_data) return;

		global_observer_pos[0] = this.state.drag_position_old[0] - event.pageX / this.state.scale_factor;
		global_observer_pos[1] = event.pageY / this.state.scale_factor - this.state.drag_position_old[1];

		nav_data.observer_pos = global_observer_pos;
		this.setState({ data: nav_data });
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

	render() {
		let objects = entityRenderer.get_objects_from_data(this.state.data, this.state.scale_factor, {
			show_id_labels: this.state.show_id_labels,
			map_border: get_map_border()
		});
		let aim_markers = this.state.radar_hover
			? entityRendererCursor.get_objects_from_data(
					() => {},
					() => {}
			  )
			: [];
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
						{solar_flares}
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
