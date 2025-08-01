import { ip } from '../configs/configs';

const EVENT_WEBSOCKET_IS_OPEN = 'websocket_is_open';

let path2server_ws = 'ws://' + ip + ':5000';
let path2server_http = 'http://' + ip + ':1924';

let websocket = new WebSocket(path2server_ws);
let input_message_last_json = {};
// let input_message_last_timestamp = '';

function receive_message({ data }) {
	// input_message_last_timestamp = new Date();
	try {
		input_message_last_json = {};
		let tmp_json = JSON.parse(data);
		if (tmp_json) input_message_last_json = tmp_json;
	} catch (error) {
		input_message_last_json = {};
	}
}

websocket.onopen = () => document.dispatchEvent(new Event(EVENT_WEBSOCKET_IS_OPEN));
websocket.addEventListener('message', receive_message);

export function addEventListener(f) {
	if (websocket) websocket.addEventListener('message', f);
}

export function removeEventListener(f) {
	if (websocket) websocket.removeEventListener('message', f);
}

export function ensureWebsocketIsOpen(f) {
	if (websocket.readyState !== 1) {
		let websocket_handler = () => {
			f();
			document.addEventListener(EVENT_WEBSOCKET_IS_OPEN, websocket_handler);
		};

		document.addEventListener(EVENT_WEBSOCKET_IS_OPEN, websocket_handler);
	} else f();
}

export function get_websocket_state() {
	return websocket.readyState;
}

export function get_http_address() {
	return path2server_http;
}

export let current_mark_id = null;

export function send_command(level, target_id, command, params, null_confirmed = false) {
	if (websocket.readyState !== 1 || (!null_confirmed && !target_id && command !== 'take_control_on_entity')) return;

	if (command === 'take_control_on_entity') current_mark_id = target_id;

	let res = {
		level: level,
		target_id: target_id,
		action: command,
		params: params
	};

	websocket.send(JSON.stringify(res));
}

export function get_system_state(system_name) {
	let message_data_json = input_message_last_json;
	return message_data_json?.state_data?.[system_name] ? message_data_json.state_data[system_name] : null;
}

export function get_navdata() {
	let message_data_json = input_message_last_json;
	if (!message_data_json?.nav_data || !message_data_json.nav_data?.hBodies || !message_data_json.nav_data?.lBodies) {
		return null;
	}

	return message_data_json.nav_data;
}

export function get_performance() {
	let message_data_json = input_message_last_json;
	return message_data_json?.performance ? message_data_json.performance : null;
}

export function get_server_systems_state() {
	let message_data_json = input_message_last_json;
	return message_data_json?.systems_state ? message_data_json.systems_state : null;
}

export function get_ships_state() {
	let message_data_json = input_message_last_json;
	return message_data_json?.ships_state ? message_data_json.ships_state : null;
}

export function get_stations_state() {
	let message_data_json = input_message_last_json;
	return message_data_json?.stations_state ? message_data_json.stations_state : null;
}

export function get_observer_id() {
	let message_data_json = input_message_last_json;
	return message_data_json?.observer_id ? message_data_json.observer_id : null;
}

export function get_capmarks() {
	let message_data_json = input_message_last_json;
	return message_data_json?.cap_marks ? message_data_json.cap_marks : null;
}

export function get_solarflare() {
	let message_data_json = input_message_last_json;
	return message_data_json?.solar_flare ? message_data_json.solar_flare : null;
}

export function take_control(key) {
	send_command('connection', key, 'take_control_on_entity', { target_id: key });
}

export function is_taking_damage() {
	let message_data_json = get_system_state('damage_sm');
	return message_data_json?.is_taking_damage ? message_data_json.is_taking_damage : false;
}

export function get_map_border() {
	let message_data_json = input_message_last_json;
	return message_data_json?.map_border ? message_data_json.map_border : null;
}
