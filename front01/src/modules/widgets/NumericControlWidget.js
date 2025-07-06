import React from 'react';

import { get_locales } from '../locales/locales';

import '../../styles/NumericControlWidget.css';

export class NumericControlWidjet extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			init_value: this.props.init_value,
			value: this.props.value ? this.props.value : this.props.init_value
		};
	}

	_getValue = () => {
		return this.props.value ? this.props.value : this.state.value;
	};

	_onChange = (value) => {
		if (value > this.props.max) value = this.props.min;
		if (value < this.props.min) value = this.props.max;
		if (value !== this._getValue()) {
			this.setState({ value: value });
			this.props.onChange(value);
		}
	};

	onChange = (e) => {
		this._onChange(+e.target.value);
	};

	reset = () => {
		this._onChange(+this.state.init_value);
	};

	render() {
		return (
			<label className="NumericControlWidjet">
				<div className="flex flex_space_between">
					{get_locales(this.props.label)}:
					<input type="number" step={this.props.step} value={this._getValue()} onChange={this.onChange} />
					<button onClick={this.reset}>{get_locales('reset')}</button>
				</div>
				<input
					disabled={this.props.disabled}
					type="range"
					min={this.props.min}
					max={this.props.max}
					step={this.props.step}
					className="slider"
					value={this._getValue()}
					onChange={this.onChange}
					//value={this.state.progradeAcc}
				/>
			</label>
		);
	}
}
