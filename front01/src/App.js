import './styles/App.css';

import React from 'react';
import SecureLS from 'secure-ls';

import { Administration } from './Administration';
import { PilotStation } from './PilotStation';
import { MapEditor } from './MapEditor';
import { ConfigEditor } from './ConfigEditor';
import { MedicStation } from './MedicStation';
import { CommonRadarStation } from './CommonRadarStation';

import { is_local } from './modules/configs/configs';
import { get_http_address, send_command } from './modules/network/connections';
import { timerscounter } from './modules/utils/updatetimers';
import { get_locales } from './modules/locales/locales';
import { GameMastering } from './GameMastering';

import './styles/basic.css';
import './styles/InteractionControlWidget.css';
import './styles/Widgets.css';
import './styles/RndControlWidget.css';
import './styles/AdminSystemViewer.css';
import './styles/common.css';
import './styles/ProjectileBuilderWidget.css';
import './styles/CrewControlWidget.css';
import './styles/EngineerControllerWidget.css';
import './styles/ProductionSM.css';
import './styles/ShipsDisplay.css';
import './styles/Plague.css';

const EVENT_AVAILABLE_MODULES_UPDATE = 'available_modules_update';
const EVENT_LOGIN_STATE_UPDATE = 'login_state_update';

const USERNAME = 'username';
const MODULE = 'module';

const local_storage = new SecureLS();

class LoginController {
	constructor() {
		this.username = local_storage.get(USERNAME);
		this.available_modules = [];

		if (this.username) {
			this._update_available_modules();
			this._startTimer();
		}
	}

	_startTimer = () => {
		timerscounter.add(this.constructor.name, setInterval(this._update_available_modules, 1000));
	};

	_stopTimer = () => {
		clearInterval(timerscounter.get(this.constructor.name));
	};

	_set_modules(modules) {
		if (JSON.stringify(this.available_modules) !== JSON.stringify(modules)) {
			this.available_modules = modules;
			document.dispatchEvent(new Event(EVENT_AVAILABLE_MODULES_UPDATE));
		}
	}

	_update_available_modules = async () => {
		return fetch(get_http_address() + '/users/roles/list', {
			method: 'GET',
			headers: { username: this.username }
		})
			.then((response) => {
				if (response.status === 200) return response.json();
			})
			.then(this._set_modules.bind(this))
			.catch((err) => console.log(err));
	};

	login = async ({ username, password }) => {
		return fetch(get_http_address() + '/users/login', {
			method: 'GET',
			headers: { Username: username, Password: password }
		})
			.then((response) => {
				if (response.status === 200) return response.status;
			})
			.then((code) => {
				if (code === 200) {
					local_storage.set(USERNAME, username);

					this.username = username;
					this._update_available_modules();

					this._stopTimer();
					this._startTimer();

					document.dispatchEvent(new Event(EVENT_LOGIN_STATE_UPDATE));

					send_command('ship.med_sm', 'Sirocco', 'log_in', { role: username }, true);
					send_command('connection', '', 'auth_login', { password: password }, true);
				}
			});
	};

	logout = () => {
		this._stopTimer();

		local_storage.remove(USERNAME);
		local_storage.remove(MODULE);

		this.username = null;
		this._set_modules([]);

		document.dispatchEvent(new Event(EVENT_LOGIN_STATE_UPDATE));

		send_command('ship.med_sm', 'Sirocco', 'log_out', { role: loginController.get_username() }, true);
	};

	get_username = () => {
		return this.username;
	};

	is_logged = () => {
		return !!this.username;
	};

	get_available_modules = () => {
		return this.available_modules;
	};
}

const loginController = new LoginController();

class LoginWindow extends React.Component {
	render() {
		return (
			<div className="LoginWindow">
				<label>
					{get_locales(USERNAME)}:{' '}
					<input
						onChange={(e) => {
							this.setState({ username: e.target.value });
						}}
					></input>
				</label>
				<label>
					{get_locales('password')}:{' '}
					<input
						type="password"
						onChange={(e) => {
							this.setState({ password: e.target.value });
						}}
					></input>
				</label>
				<button onClick={() => loginController.login(this.state)}>login</button>
			</div>
		);
	}
}

class Navigation extends React.Component {
	onModulesUpdate() {
		let modules = loginController.get_available_modules();
		if (modules.length) {
			if (!this.props.module) this.props.selectModule(modules[0]);
			else if (!modules.includes(this.props.module)) this.props.selectModule(null);
		}

		this.forceUpdate();
	}

	componentDidMount() {
		this.onModulesUpdate();
		document.addEventListener(EVENT_AVAILABLE_MODULES_UPDATE, this.onModulesUpdate.bind(this));
	}

	render() {
		let list = loginController.get_available_modules();
		let list_nav = [];

		for (let i in list) {
			let val = get_locales(list[i]);
			let item_name = list[i];
			if (item_name === this.props.module) val = <b>{val}</b>;

			list_nav.push(
				<label
					key={item_name}
					className="Navigation_item"
					onClick={() => {
						this.props.selectModule(item_name);
					}}
				>
					{val}
				</label>
			);
		}

		list_nav.push(
			<button key="logout" onClick={loginController.logout}>
				{get_locales('LOGOUT')}
			</button>
		);

		/*list_nav.push(<button
         onClick={(e) => {
         send_command("server", null, "run", null, true)
         }}>
         RUN
        </button>)

       
        list_nav.push(<button
         onClick={(e) => {
         send_command("server", null, "pause", null, true)
         }}>
         PAUSE
        </button>)*/

		return (
			<div className="Navigation">
				<b>{get_locales('Navigation')}:</b>
				{list_nav}
			</div>
		);
	}
}

class ModuleRenderer extends React.Component {
	render() {
		switch (this.props.module) {
			case 'map_editor':
				return <MapEditor></MapEditor>;

			case 'admin':
				return <Administration selectModule={this.props.selectModule}></Administration>;

			case 'game_master':
				return (
					<GameMastering
						username={loginController.get_username()}
						selectModule={this.props.selectModule}
					></GameMastering>
				);

			case 'pilot':
				return <PilotStation username={loginController.get_username()} admin={true}></PilotStation>;

			case 'navigator':
				return <PilotStation username={loginController.get_username()} navigator={true}></PilotStation>;

			case 'engineer':
				return <PilotStation username={loginController.get_username()} engineer={true}></PilotStation>;

			case 'cannoneer':
				return <PilotStation username={loginController.get_username()} cannoneer={true}></PilotStation>;

			case 'engineer_old':
				return <PilotStation username={loginController.get_username()} engineer_old={true}></PilotStation>;

			case 'captain':
				return <PilotStation username={loginController.get_username()} captain={true}></PilotStation>;

			case 'config_editor':
				return <ConfigEditor key="ConfigEditor" />;

			case 'NPC_pilot':
				return <PilotStation NPC_pilot={true}></PilotStation>;

			case 'medic':
				return <MedicStation username={loginController.get_username()}></MedicStation>;

			case 'common_radar':
				return <CommonRadarStation />;

			default:
				return <div>{get_locales('Module not available')}</div>;
		}
	}
}

class MainApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			module: local_storage.get(MODULE)
		};
	}

	selectModule = (module_name) => {
		this.setState({ module: module_name });
		local_storage.set(MODULE, module_name);
	};

	render() {
		if (is_local() && window.location.host.split(':')[0] !== 'localhost') return <div>Test NPM Server</div>;

		return (
			<div className="App" key="App">
				<Navigation module={this.state.module} selectModule={this.selectModule}></Navigation>
				<ModuleRenderer
					key="ModuleRenderer"
					module={this.state.module}
					selectModule={this.selectModule}
				></ModuleRenderer>
			</div>
		);
	}
}

class App extends React.Component {
	componentDidMount() {
		document.addEventListener(EVENT_LOGIN_STATE_UPDATE, () => {
			this.forceUpdate();
		});
	}

	render() {
		if (loginController.is_logged()) return <MainApp />;
		return <LoginWindow />;
	}
}

export default App;
