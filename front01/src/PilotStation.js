import React from 'react';

import { RnDControlWidget } from './modules/systems/RnD_sm';
import { RadarControlWidget } from './modules/systems/radar_sm';
import { DamageControlWidget } from './modules/systems/damage_sm';
import { EnergyControlWidget } from './modules/systems/energy_sm';
import { EngineControlWidget } from './modules/systems/engine_sm';
import { InteractionControlWidget } from './modules/systems/interact_sm';

import { EngineerControllerWidget } from './modules/widgets/ShipOverview';
import { ShipsDisplay } from './modules/widgets/ShipsDisplay';
import { CapMarksControlWidget } from './modules/widgets/CapMarksControlWidget';
import { PlayersRadarWidget } from './modules/widgets/PlayerRadar';

import {
	addEventListener,
	removeEventListener,
	ensureWebsocketIsOpen,
	get_observer_id,
	take_control,
} from './modules/network/connections';

import './styles/PilotStation.css';

export class PilotStation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			is_taking_damage: false,
			mental_stamina_level: 8
		};
	}

	componentDidMount() {
		if (!this.props.NPC_pilot && get_observer_id() == null) ensureWebsocketIsOpen(() => take_control('Пионер'));
	}

	set_MP_stamina_level = (mental_stamina_level) => {
		this.setState({ mental_stamina_level: mental_stamina_level });
	};

	set_HP_stamina_level = (hp_level) => {
		this.setState({ hp_level: hp_level });
	};

	get_MP_visual_effects_class = () => {
		if (this.state.mental_stamina_level > 5) return '';
		if (this.state.mental_stamina_level > 3) return 'PilotStation_light_MP_fatigue';
		if (this.state.mental_stamina_level > 1) return 'PilotStation_hard_MP_fatigue';
		return 'PilotStation_crit_MP_fatigue';
	};

	get_HP_visual_effects_class = () => {
		if (this.state.hp_level >= 8) return '';
		if (this.state.hp_level > 4) return 'PilotStation_light_HP';
		if (this.state.hp_level > 1) return 'PilotStation_hard_HP';
		return 'PilotStation_crit_HP';
	};

	render() {
		let result = [];
		if (this.props.admin) {
			result.push(
				<div key="admin_controls_1" className="SystemsLayer SystemsLayerShort">
					<RnDControlWidget />
					<DamageControlWidget />
					<EnergyControlWidget />
				</div>
			);

			result.push(
				<React.Fragment key="admin_controls_2">
					<div className="engineControlSection">
						<EngineControlWidget />
						<InteractionControlWidget />
						<RadarControlWidget />
					</div>
				</React.Fragment>
			);
		}

		if (this.props.navigator) {
			result.push(<EngineControlWidget key="navigator_controls"/>);
		}

		if (this.props.captain) {
			result.push(
				<React.Fragment key="captain_controls">
					<EngineerControllerWidget key="engineer_controls" role="engineer" />
					<CapMarksControlWidget />
				</React.Fragment>
			);
		}

		if (this.props.NPC_pilot) {
			if (get_observer_id()) {
				result.push(
					<div key="NPC_pilot_controls_1" className="SystemsLayer">
						<DamageControlWidget />
						<EnergyControlWidget />
					</div>
				);

				result.push(
					<React.Fragment key="NPC_pilot_controls_2">
						<div className="engineControlSection">
							<EngineControlWidget />
							<RadarControlWidget />
						</div>
					</React.Fragment>
				);
			} else {
				let self = this;
				let observer_watch = () => {
					if (get_observer_id()) {
						self.forceUpdate();
						removeEventListener(observer_watch);
					}
				};
				addEventListener(observer_watch);

				result.push(<ShipsDisplay key="NPC_pilot_controls" />);
			}
		}

		let add_MPclassName = this.get_MP_visual_effects_class();
		let add_HPclassName = this.get_HP_visual_effects_class();

		return (
			<div className={'PilotStation ' + add_MPclassName + ' ' + add_HPclassName}>
				<PlayersRadarWidget
					arrow_scaling={this.props.navigator | this.props.NPC_pilot}
					can_aim={this.props.admin | this.props.NPC_pilot}
					cap_control={this.props.captain}
				/>

				<div className={'PilotStationControlSection' + (this.state.is_taking_damage ? 'is_taking_damage' : '')}>
					{result}
				</div>
			</div>
		);
	}
}

export const Modal = ({ handleClose, show, children }) => {
	const showHideClassName = show ? 'display-block' : 'display-none modal';

	let child_elem = React.cloneElement(children, {
		cancel_button: (
			<button className="button_grey" onClick={handleClose}>
				close
			</button>
		)
	});

	return (
		<div className={showHideClassName}>
			<section className="modal_page">
				<div className="modalcontent">{child_elem}</div>
			</section>
		</div>
	);
};
