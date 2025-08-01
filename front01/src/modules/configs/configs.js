export const ip = '46.173.24.79';
//export const ip = "192.168.1.4";

export function is_local() {
	//return false;
	return ip === 'localhost';
}
