import React from 'react';

import { PlayersRadarWidget } from './modules/widgets/PlayerRadar.js';
import { DamageControlWidget } from './modules/systems/damage_sm.js';
import { EnergyControlWidget } from './modules/systems/energy_sm.js';
import { ResourcesControlWidget } from './modules/systems/resources_sm.js';
import { InteractionControlWidget } from './modules/systems/interact_sm.js';
import { RnDControlWidget } from './modules/systems/RnD_sm.js';
import { EngineControlWidget } from './modules/systems/engine_sm.js';
import { ShaftsControlWidget } from './modules/systems/launcher_sm.js';
import { ProjectileBuilderWidget } from './modules/systems/projectile_builder.js';
import {
	get_observer_id,
	get_websocket_state,
	take_control,
	get_system_state,
	EVENT_WEBSOCKET_IS_OPEN
} from './modules/network/connections';
import { timerscounter } from './modules/utils/updatetimers';
import { CrewControlWidget } from './modules/systems/crew_sm.js';
import { EngineerControllerWidget } from './modules/widgets/ShipOverview.js';
import { RadarControlWidget } from './modules/systems/radar_sm.js';
import { CapMarksControlWidget } from './modules/widgets/CapMarksControlWidget.js';
import { ShipOvervieweWidgetLayer } from './modules/widgets/ShipOverview.js';
import { RoleManagerWidget } from './modules/widgets/RolesManager.js';
import { get_medicine_state } from './modules/network/connections';
import { AllianceManager } from './modules/widgets/AllianceManager.js';

import './styles/PilotStation.css';

export class PilotStation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected: null,
			is_taking_damage: false,
			mental_stamina_level: 8
		};

		this._handle_websocket_bind = this._handle_websocket.bind(this);
	}

	_handle_websocket() {
		take_control('Sirocco');
		document.addEventListener(EVENT_WEBSOCKET_IS_OPEN, this._handle_websocket_bind);
	}

	componentDidMount() {
		if (!this.props.NPC_pilot && get_observer_id() == null) {
			if (get_websocket_state() !== 1) {
				document.addEventListener(EVENT_WEBSOCKET_IS_OPEN, this._handle_websocket_bind);
			} else take_control('Sirocco');
		}
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
		let is_taking_damage_class = '';
		if (this.state.is_taking_damage) {
			is_taking_damage_class = 'is_taking_damage_class';
		}

		let result = [];
		if (this.props.admin) {
			result.push(
				<div key="admin_controls_1" className={'SystemsLayer SystemsLayerShort'}>
					<CrewControlWidget />
					<RnDControlWidget />
					<DamageControlWidget />
					<EnergyControlWidget />
				</div>
			);

			result.push(
				<div key="admin_controls_2" className="ControlLayer">
					<div className="engineControlSection">
						<EngineControlWidget />
						<InteractionControlWidget />
						<RadarControlWidget />
					</div>
					<ShaftsControlWidget />
				</div>
			);
		}

		if (this.props.engineer) {
			result.push(<EngineerControllerWidget key="engineer_controls" role={'engineer'} />);
		}

		if (this.props.navigator) {
			result.push(
				<div key="navigator_controls" className="ControlLayer">
					<div className="engineControlSection">
						<EngineControlWidget />
						<InteractionControlWidget />
					</div>
				</div>
			);
		}

		if (this.props.cannoneer) {
			result.push(
				<div key="cannoneer_controls" className="ControlLayer">
					<ShaftsControlWidget />
					<ProjectileBuilderWidget />
					<ResourcesControlWidget />
				</div>
			);
		}

		if (this.props.engineer_old) {
			let clname = 'SystemsLayer';
			result.push(
				<div key="engineer_old_controls" className={clname}>
					<DamageControlWidget />
					<CrewControlWidget />
					<ResourcesControlWidget />
					<RnDControlWidget />
					<EnergyControlWidget />
				</div>
			);
		}

		if (this.props.captain) {
			let clname = '';
			result.push(
				<div key="captain_controls" className={clname}>
					<ShipOvervieweWidgetLayer role={'captain'} />
					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							height: 'fit-content'
						}}
					>
						<CrewControlWidget />
						<RoleManagerWidget username={this.props.username} />
						<AllianceManager></AllianceManager>
					</div>
					<CapMarksControlWidget />
				</div>
			);
		}

		if (this.props.NPC_pilot) {
			result.push(
				<div key="NPC_pilot_controls_1" className={'SystemsLayer'}>
					<DamageControlWidget />
					<EnergyControlWidget />
				</div>
			);

			result.push(
				<div key="NPC_pilot_controls_2" className="ControlLayer">
					<div className="engineControlSection">
						<EngineControlWidget />
						<RadarControlWidget />
					</div>
					<ShaftsControlWidget />
				</div>
			);
		}

		let add_MPclassName = this.get_MP_visual_effects_class();
		let add_HPclassName = this.get_HP_visual_effects_class();

		return (
			<div className={'PilotStation ' + add_MPclassName + ' ' + add_HPclassName}>
				<PlayersRadarWidget
					arrow_scaling={this.props.navigator | this.props.NPC_pilot}
					can_aim={this.props.cannoneer | this.props.admin | this.props.NPC_pilot}
					cap_control={this.props.captain}
				/>

				<div className={'PilotStationControlSection ' + is_taking_damage_class}>{result}</div>

				<MedicineStateWidget
					set_MP_stamina_level={this.set_MP_stamina_level}
					set_HP_stamina_level={this.set_HP_stamina_level}
					username={this.props.username}
				/>
			</div>
		);
	}
}

class MedicineStateWidget extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			active: true
		};
	}

	componentDidMount() {
		let timer_id = timerscounter.get(this.constructor.name);
		if (!timer_id) clearInterval(timer_id);

		timer_id = setInterval(this.define_state, 30);
		timerscounter.add(this.constructor.name, timer_id);
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	define_state = () => {
		if (['captain', 'engineer', 'navigator', 'cannoneer'].includes(this.props.username)) {
			let state = get_medicine_state(this.props.username);
			let med_state = get_system_state('med_sm');
			let user_stats_MP = 8;
			let user_stats_HP = 8;

			if (med_state) {
				user_stats_MP = med_state['roles'][this.props.username]['MP'];
				user_stats_HP = med_state['roles'][this.props.username]['HP'];
			}

			this.props.set_MP_stamina_level(user_stats_MP);
			this.props.set_HP_stamina_level(user_stats_HP);
			this.setState({ active: state });
		}
	};

	render() {
		if (!this.state.active) {
			return (
				<Modal>
					<label>{this.props.username}: ВЫ ПОЛУЧИЛИ РАНЕНИЕ! ОБРАТИТЕСЬ К МЕДИКУ!</label>
				</Modal>
			);
		}

		return <div></div>;
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
