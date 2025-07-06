import React from 'react';

import { Canvas } from '@react-three/fiber';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_navdata, get_solarflare, get_map_border } from '../network/connections';

import { NumericControlWidjet } from '../widgets/NumericControlWidget';

import { entityRendererCursor } from '../renderers/CursorRenderer';
import { entityRenderer } from '../renderers/EntityRenderer';
import { radarRenderer } from '../renderers/RadarRenderer';

import { INITIAL_SCALE_FACTOR, MIN_SCALE_FACTOR, MAX_SCALE_FACTOR, STEP_SCALE_FACTOR } from './PlayerRadar';

export const OBSERVER_MOVE_STEP = 20;
export const DIR_UP = 'up';
export const DIR_DOWN = 'down';
export const DIR_LEFT = 'left';
export const DIR_RIGHT = 'right';

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
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
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

	onNavBtnDown = (event) => {
		let x = 0;
		let y = 0;
		switch (event.target.dataset.dir) {
			case DIR_UP:
				y += OBSERVER_MOVE_STEP;
				break;
			case DIR_DOWN:
				y -= OBSERVER_MOVE_STEP;
				break;
			case DIR_LEFT:
				x -= OBSERVER_MOVE_STEP;
				break;
			case DIR_RIGHT:
				x += OBSERVER_MOVE_STEP;
				break;
			default:
				return;
		}

		let increment = () => this._move_observer(global_observer_pos[0] + x, global_observer_pos[1] + y);
		increment();

		let interval = setInterval(increment, 30);
		let clearHandler = () => {
			clearInterval(interval);
			document.removeEventListener('mouseup', clearHandler);
			event.target.removeEventListener('mouseleave', clearHandler);
		};
		document.addEventListener('mouseup', clearHandler);
		event.target.addEventListener('mouseleave', clearHandler);
	};

	get_buttons_block = () => {
		return (
			<div className="AccelerationController_btnblock">
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_UP}>
					🠉
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_LEFT}>
					🠈
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_DOWN}>
					🠋
				</button>
				<button onMouseDown={this.onNavBtnDown} data-dir={DIR_RIGHT}>
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
