import React from 'react';

import { get_locales } from '../locales/locales';

import '../../styles/NumericControlWidget.css';

export class NumericControlWidjet extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.init_value
		};
	}

	onChange = (e) => {
		let value = e.target.value;
		this.setState({ value: value }, () => this.props.onChange(value));
	};

	render() {
		return (
			<label>
				{get_locales(this.props.label)}:
				<input
					disabled={this.props.disabled}
					type="range"
					min={this.props.min}
					max={this.props.max}
					step={this.props.step}
					className="slider"
					value={this.state.value}
					onChange={this.onChange}
					//value={this.state.progradeAcc}
				/>
				{parseFloat(this.state.value).toFixed(2)}
			</label>
		);
	}
}
