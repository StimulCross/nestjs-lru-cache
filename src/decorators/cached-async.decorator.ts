import { Inject } from '@nestjs/common';
import type { CachedAsyncDecoratorOptions } from '../interfaces/cached-async-decorator-options.interface';
import type { CacheArgumentOptions } from '../interfaces/cache-argument-options.interface';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY } from '../constants';
import { isObject } from '../utils/is-object';
import { LruCache } from '../providers/lru-cache';
import { wrapCacheKey } from '../utils/wrap-cache-key';

function createCachedAsyncFunction(
	target: object,
	propertyKey: string | symbol,
	origFn: Function,
	options: CachedAsyncDecoratorOptions
) {
	return async function (
		this: { [CACHE_INSTANCE_ID_PROPERTY]?: number; [CACHE_INSTANCE]: LruCache },
		...args: unknown[]
	) {
		const cacheInstanceId = this[CACHE_INSTANCE_ID_PROPERTY] ? `_${this[CACHE_INSTANCE_ID_PROPERTY]}` : '';
		let cacheOptionsArg: CacheArgumentOptions | undefined;

		if (options.useArgumentOptions && args.length > 0) {
			const possibleCacheOptions = args.at(-1);

			if (isObject<CacheArgumentOptions>(possibleCacheOptions)) {
				cacheOptionsArg = possibleCacheOptions;
			}
		}

		const mergedOptions = { ...options, ...cacheOptionsArg };

		let cacheKey = mergedOptions.useSharedCache
			? `${this.constructor.name}.${String(propertyKey)}`
			: `${this.constructor.name}${cacheInstanceId}.${String(propertyKey)}`;

		if (options.hashFunction) {
			cacheKey += `:${options.hashFunction.apply(this, args)}`;
		}

		cacheKey = wrapCacheKey(cacheKey);

		if ((mergedOptions.returnCached ?? true) && this[CACHE_INSTANCE].has(cacheKey, mergedOptions)) {
			const cachedVal = this[CACHE_INSTANCE].get(cacheKey, mergedOptions);

			if (cachedVal instanceof Promise) {
				return (await cachedVal) as unknown;
			}

			return cachedVal;
		}

		const originalPromise = origFn.apply(this, args) as Promise<unknown>;

		if (mergedOptions.cachePromise ?? true) {
			this[CACHE_INSTANCE].set(cacheKey, originalPromise, mergedOptions);
		}

		const result = await originalPromise;

		if (mergedOptions.cachePromiseResult ?? true) {
			this[CACHE_INSTANCE].set(cacheKey, result, mergedOptions);
		} else {
			this[CACHE_INSTANCE].delete(cacheKey);
		}

		return result;
	};
}

/**
 * Decorates an async method to apply automatic caching logic.
 *
 * Takes one argument, which can be either a hash function, a TTL number, or an options object.
 *
 * @example
 * ```ts
 * // Simple application with default options
 * @CachedAsync()
 * public getUserById(id: number) { ... }
 *
 * // TTL overload
 * @CachedAsync(5000)
 * public getUserById(id: number) { ... }
 *
 * // Hash function overload
 * @CachedAsync((id: number) => String(id))
 * public getUserById(id: number) { ... }
 *
 * // Options object overload
 * @CachedAsync({ ttl: 5000, hashFunction: (id: number) => String(id) })
 * public getUserById(id: number) { ... }
 * ```
 */
export function CachedAsync<K = any, V = any>(options?: CachedAsyncDecoratorOptions<K, V>): MethodDecorator;
export function CachedAsync(ttl?: CachedAsyncDecoratorOptions['ttl']): MethodDecorator;
export function CachedAsync(hashFunction?: CachedAsyncDecoratorOptions['hashFunction']): MethodDecorator;
export function CachedAsync<K = any, V = any>(
	optionsOrHashFunctionOrTtl:
		| CachedAsyncDecoratorOptions<K, V>
		| CachedAsyncDecoratorOptions['ttl']
		| CachedAsyncDecoratorOptions['hashFunction'] = {}
): MethodDecorator {
	const injectCache = Inject(LruCache);

	return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor => {
		injectCache(target, CACHE_INSTANCE);
		let options: CachedAsyncDecoratorOptions<K, V> = {};

		if (typeof optionsOrHashFunctionOrTtl === 'object') {
			options = optionsOrHashFunctionOrTtl;
		} else if (typeof optionsOrHashFunctionOrTtl === 'number') {
			options.ttl = optionsOrHashFunctionOrTtl;
		} else if (typeof optionsOrHashFunctionOrTtl === 'function') {
			options.hashFunction = optionsOrHashFunctionOrTtl;
		}

		if (typeof descriptor.value === 'function') {
			descriptor.value = createCachedAsyncFunction(target, propertyKey, descriptor.value, options);
		}

		return descriptor;
	};
}
