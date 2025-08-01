import React from 'react';

import { get_locales } from '../locales/locales';

import { NumericControlWidjet } from './NumericControlWidget';

export class MapEditorBrushesWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			mode: 'deleter', //"creator"
			active: false,
			radius: 1000,
			min_size: 140,
			max_size: 150,
			min_weight: 1,
			max_weight: 5,
			obstacles_min_count: 1,
			obstacles_max_count: 10,
			obstacles_probability: 100,
			obstacles_type: 'MeteorsCloud',
			closer: false
		};
	}

	onChangeParam = (key, value) => {
		let tmp = this.state;
		tmp[key] = value;
		this.props.onBrushChange(tmp);
		this.setState(tmp);
	};

	get_mode_selector = () => {
		let result = [];
		let options = [
			'deleter',
			'creator',
			'brush_weight_editor',
			'obstacles_creator',
			'obstacles_deleter',
			'selector',
			'cacher',
			'uncacher'
		];
		for (let tmp_i in options) {
			result.push(
				<button key={tmp_i} onClick={(e) => this.onChangeParam('mode', options[tmp_i])}>
					{get_locales(options[tmp_i])}
				</button>
			);
		}

		return <div key="mode_selector">{result}</div>;
	};

	get_creator_params = () => {
		let inputs = [];
		let keys = ['radius', 'min_size', 'max_size', 'min_weight', 'max_weight'];
		for (let key in keys) {
			let keyname = keys[key];
			let val = this.state[keyname];
			inputs.push(
				<NumericControlWidjet
					inline={true}
					label={keyname}
					init_value={val}
					min={1}
					max={9999}
					step={1}
					value={val}
					onChange={(value) => this.onChangeParam(keyname, value)}
				/>
			);
		}

		let keyname = 'closer';
		inputs.push(
			<label key={keyname}>
				{get_locales(keyname)}:{' '}
				<input type="checkbox" onChange={(e) => this.onChangeParam(keyname, e.target.checked)} value={this.state[keyname]} />
			</label>
		);

		return (
			<div key="creator_params" className="flex flex_column">
				{inputs}
			</div>
		);
	};

	get_obstacles_creator_params = () => {
		let inputs = [];
		let keys = ['radius', 'obstacles_min_count', 'obstacles_max_count', 'obstacles_probability'];
		for (let tmp_i in keys) {
			let keyname = keys[tmp_i];
			let val = this.state[keyname];
			inputs.push(
				<NumericControlWidjet
					inline={true}
					label={keyname}
					init_value={val}
					min={1}
					max={tmp_i === 'obstacles_probability' ? 100 : 9999}
					step={1}
					value={val}
					onChange={(value) => this.onChangeParam(keyname, value)}
				/>
			);
		}

		let keyname = 'obstacles_type';
		inputs.push(
			<label key={keyname}>
				{get_locales(keyname)}:{' '}
				<select onChange={(e) => this.onChangeParam(keyname, e.target.value)} value={this.state[keyname]}>
					<option value="MeteorsCloud">MeteorsCloud</option>
				</select>
			</label>
		);

		return (
			<div key="obstacles_creator_params" className="flex flex_column">
				{inputs}
			</div>
		);
	};

	get_deleter_params = () => {
		let inputs = [];
		let keys = ['radius'];
		for (let tmp_i in keys) {
			let keyname = keys[tmp_i];
			let val = this.state[keyname];
			inputs.push(
				<NumericControlWidjet
					inline={true}
					label={keyname}
					init_value={val}
					min={1}
					max={9999}
					step={1}
					value={val}
					onChange={(value) => this.onChangeParam(keyname, value)}
				/>
			);
		}

		return (
			<div key="deleter_params" className="flex flex_column">
				{inputs}
			</div>
		);
	};

	get_params_panel = () => {
		switch (this.state.mode) {
			case 'creator':
			case 'brush_weight_editor':
				return this.get_creator_params();
			case 'obstacles_creator':
				return this.get_obstacles_creator_params();
			case 'obstacles_deleter':
			case 'deleter':
			case 'selector':
			case 'cacher':
			case 'uncacher':
				return this.get_deleter_params();
			default:
				return {};
		}
	};

	render() {
		let inputs = [
			<label key="inputs">
				{get_locales('State')}:
				<button onClick={(e) => this.onChangeParam('active', !this.state.active)}>
					{get_locales(this.state.active ? 'on' : 'off' )}
				</button>
			</label>,
			this.get_mode_selector()
		];

		return (
			<div className="flex flex_column">
				<b>Brush Controller</b>
				{inputs}
				{this.get_params_panel()}
			</div>
		);
	}
}
