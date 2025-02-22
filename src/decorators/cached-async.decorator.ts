import { Inject, Logger } from '@nestjs/common';
import { type LRUCache } from 'lru-cache';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY, LRU_CACHE } from '../constants';
import { type CacheArgumentOptions, type CachedAsyncDecoratorOptions } from '../interfaces';
import { isObject, wrapCacheKey } from '../utils';

const logger = new Logger('LruCache', { timestamp: true });

function createCachedAsyncFunction(
	target: object,
	propertyKey: string | symbol,
	origFn: Function,
	options: CachedAsyncDecoratorOptions,
) {
	return async function (
		this: { [CACHE_INSTANCE_ID_PROPERTY]?: number; [CACHE_INSTANCE]?: LRUCache<any, any> },
		...args: unknown[]
	) {
		if (!this[CACHE_INSTANCE]) {
			logger.warn(
				`Failed to get the cache instance in method ${target.constructor.name}.${String(
					propertyKey,
				)}(). This may be because the class using the @CachedAsync decorator has not been registered as a provider in the NestJS module, and therefore is not available in the DI container. This method's results will not be cached.`,
			);
			return await (origFn.apply(this, args) as Promise<unknown>);
		}

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

		if (!mergedOptions.ignoreCached && this[CACHE_INSTANCE].has(cacheKey, mergedOptions)) {
			const cachedVal: unknown = this[CACHE_INSTANCE].get(cacheKey, mergedOptions);

			if (cachedVal instanceof Promise) {
				return (await cachedVal) as unknown;
			}

			return cachedVal;
		}

		const originalPromise = origFn.apply(this, args) as Promise<unknown>;

		if (mergedOptions.cachePromise ?? true) {
			this[CACHE_INSTANCE].set(cacheKey, originalPromise, mergedOptions);
		}

		let result: unknown;

		try {
			result = await originalPromise;
		} catch (e) {
			if (mergedOptions.deleteRejectedPromise) {
				this[CACHE_INSTANCE].delete(cacheKey);
			}

			throw e;
		}

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
		| CachedAsyncDecoratorOptions['hashFunction'] = {},
): MethodDecorator {
	const injectCache = Inject(LRU_CACHE);

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
