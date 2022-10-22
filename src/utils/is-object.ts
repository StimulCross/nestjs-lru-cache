export function isObject<T extends object = object>(val: unknown): val is T {
	return Object.prototype.toString.call(val) === '[object Object]';
}
