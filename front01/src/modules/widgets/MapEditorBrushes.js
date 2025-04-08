import React from 'react';

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
				<button
					key={tmp_i}
					onClick={(e) => {
						this.onChangeParam('mode', options[tmp_i]);
					}}
				>
					{options[tmp_i]}
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
			inputs.push(
				<label key={keyname}>
					{' '}
					{keyname}:{' '}
					<input
						onChange={(e) => {
							this.onChangeParam(keyname, parseFloat(e.target.value));
						}}
						value={this.state[keyname]}
					></input>
				</label>
			);
		}

		let keyname = 'closer';
		inputs.push(
			<label key={keyname}>
				{' '}
				{keyname}:{' '}
				<input
					type="checkbox"
					onChange={(e) => {
						this.onChangeParam(keyname, e.target.checked);
					}}
					value={this.state[keyname]}
				></input>
			</label>
		);

		return (
			<div
				key="creator_params"
				style={{
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				{inputs}
			</div>
		);
	};

	get_obstacles_creator_params = () => {
		let inputs = [];
		let keys = ['radius'];
		for (let tmp_i in keys) {
			let keyname = keys[tmp_i];
			inputs.push(
				<label key={keyname}>
					{' '}
					{keyname}:{' '}
					<input
						onChange={(e) => {
							this.onChangeParam(keyname, parseFloat(e.target.value));
						}}
						value={this.state[keyname]}
					></input>
				</label>
			);
		}

		let keyname = 'obstacles_type';
		inputs.push(
			<label key={keyname}>
				{' '}
				{keyname}:{' '}
				<select
					onChange={(e) => {
						this.onChangeParam(keyname, e.target.value);
					}}
					value={this.state[keyname]}
				>
					<option value={'MeteorsCloud'}>MeteorsCloud</option>
					<option value={'Mine_type1'}>Mine_type1</option>
					<option value={'Mine_type2'}>Mine_type2</option>
					<option value={'Mine_type1/Mine_type2'}>Mine_type1/Mine_type2</option>
				</select>
			</label>
		);

		keys = ['obstacles_min_count', 'obstacles_max_count', 'obstacles_probability'];
		for (let tmp_i in keys) {
			let keyname = keys[tmp_i];
			inputs.push(
				<label key={keyname}>
					{' '}
					{keyname}:{' '}
					<input
						onChange={(e) => {
							this.onChangeParam(keyname, parseFloat(e.target.value));
						}}
						value={this.state[keyname]}
					></input>
				</label>
			);
		}

		return (
			<div
				key="obstacles_creator_params"
				style={{
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				{inputs}
			</div>
		);
	};

	get_deleter_params = () => {
		let inputs = [];
		let keys = ['radius'];
		for (let tmp_i in keys) {
			let keyname = keys[tmp_i];
			inputs.push(
				<label key={keyname}>
					{' '}
					{keyname}:{' '}
					<input
						onChange={(e) => {
							this.onChangeParam(keyname, parseFloat(e.target.value));
						}}
						value={this.state[keyname]}
					></input>
				</label>
			);
		}

		return (
			<div
				key="deleter_params"
				style={{
					display: 'flex',
					flexDirection: 'column'
				}}
			>
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
				{' '}
				State:
				<button
					onClick={(e) => {
						this.onChangeParam('active', !this.state.active);
					}}
				>
					{' '}
					{this.state.active.toString()}{' '}
				</button>{' '}
			</label>,
			this.get_mode_selector()
		];

		return (
			<div
				style={{
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				<b>Brush Controller</b>
				{inputs}
				{this.get_params_panel()}
			</div>
		);
	}
}
