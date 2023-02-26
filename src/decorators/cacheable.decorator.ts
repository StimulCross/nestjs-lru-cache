import { CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../constants';

/**
 * Marks a class as cacheable.
 *
 * This only useful if the class has multiple instances (e.g. `TRANSIENT` or `REQUEST` scoped) and you don't want the
 * same methods on different instances to share the same cache space.
 * If you have a single instance, or you want to have the shared cache for the same methods on different class
 * instances, then do not apply this decorator.
 */
export function Cacheable() {
	return function <T extends new (...args: any[]) => object>(target: T): any {
		target[CACHE_INSTANCES_PROPERTY] = 0;

		return class CacheableClass extends target {
			constructor(...args: any[]) {
				super(...args);

				Object.defineProperty(CacheableClass, 'name', {
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
