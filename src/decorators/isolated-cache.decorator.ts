import { CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../constants';

/**
 * Marks a class to use an isolated cache.
 *
 * This is useful if the class has multiple instances (e.g., `TRANSIENT` scope) and you want each instance
 * to have its own separate cache space for the same methods, avoiding sharing cached data across instances.
 *
 * If your class has a single instance (e.g., `SINGLETON` scope), or if you want all instances of the class
 * to share the same cache space, this decorator should not be applied.
 */
export function IsolatedCache() {
	return function <T extends new (...args: any[]) => object>(target: T): any {
		target[CACHE_INSTANCES_PROPERTY] = 0;

		return class IsolatedCacheClass extends target {
			constructor(...args: any[]) {
				super(...args);

				Object.defineProperty(IsolatedCacheClass, 'name', {
					enumerable: false,
					writable: false,
					configurable: true,
					value: target.name
				});

				Object.defineProperty(this, CACHE_INSTANCE_ID_PROPERTY, {
					enumerable: false,
					writable: false,
					configurable: false,
					value: ++target[CACHE_INSTANCES_PROPERTY]
				});
			}
		};
	};
}
