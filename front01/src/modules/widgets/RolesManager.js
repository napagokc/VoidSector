import React from 'react';

import { get_locales } from '../locales/locales';

import { timerscounter } from '../utils/updatetimers';

import { get_http_address } from '../network/connections';

export class RoleManagerWidget extends React.Component {
	componentDidMount() {
		clearInterval(timerscounter.get(this.constructor.name));
		timerscounter.add(this.constructor.name, setInterval(this.onUpdate, 1000));

		this.onUpdate();
	}

	componentWillUnmount() {
		clearInterval(timerscounter.get(this.constructor.name));
	}

	onUpdate = () => {
		return fetch(get_http_address() + '/users/roles/table', { method: 'GET', headers: {} })
			.then((response) => {
				if (response.status === 200) return response.json();
			})
			.then((data) => {
				if (data) this.setState(data);
			})
			.catch((error) => {
				console.error('There is some error', error);
			});
	};

	onAssignRole = (username, role, state) => {
		return fetch(get_http_address() + '/users/roles/role', {
			method: 'PUT',
			headers: {
				Username: username,
				Role: role,
				State: state
			}
		})
			.then((response) => {
				if (response.status === 200) return response.json();
			})
			.then((data) => {
				if (data) this.setState(data);
			});
	};

	is_module_accesable = (username, modulename) => {
		return this.state?.[username]?.[modulename] ? this.state[username][modulename] : false;
	};

	get_assigned_roles_row = (username) => {
		let result = [<td key="col_name">{get_locales(username)}</td>];
		let available_modules = ['captain', 'navigator', 'cannoneer', 'engineer'];

		for (let i in available_modules) {
			let modulename = available_modules[i];
			result.push(
				<td key={'col_' + modulename}>
					<input
						type="checkbox"
						disabled={modulename === username && this.props.username !== 'admin'}
						onChange={(e) => {
							this.onAssignRole(username, modulename, e.target.checked);
						}}
						checked={this.is_module_accesable(username, modulename)}
					/>
				</td>
			);
		}

		return <tr key={'row_' + username}>{result}</tr>;
	};

	get_roles_table = () => {
		let result = [];
		let usernames = ['captain', 'navigator', 'cannoneer', 'engineer'];
		for (let i in usernames) {
			let username = usernames[i];
			result.push(this.get_assigned_roles_row(username));
		}

		return (
			<table>
				<thead>
					<tr>
						<th>{get_locales('')}</th>
						<th>{get_locales('captain')}</th>
						<th>{get_locales('navigator')}</th>
						<th>{get_locales('cannoneer')}</th>
						<th>{get_locales('engineer')}</th>
					</tr>
				</thead>
				<tbody>{result}</tbody>
			</table>
		);
	};

	render() {
		return <div>{this.get_roles_table()}</div>;
	}
}
