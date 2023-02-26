import { Inject, Injectable } from '@nestjs/common';
import * as LRUCache from 'lru-cache';
import { type GetOptions, type PeekOptions, type SetOptions } from 'lru-cache';
import { LRU_CACHE_OPTIONS } from '../constants';
import { LruCacheOptions } from '../interfaces';

/**
 * LRU cache service.
 *
 * Allows you to specify <K, V> (key, value) type parameters.
 */
@Injectable()
export class LruCache<K = any, V = any> extends LRUCache<K, V> {
	/** @internal */
	constructor(@Inject(LRU_CACHE_OPTIONS) private readonly _options: LruCacheOptions) {
		super(_options);
	}

	/**
	 * Returns a value from the cache.
	 *
	 * If the key is not found, `get()` will return `undefined`.
	 * This can be confusing when setting values specifically to `undefined`, as in `set(key, undefined)`. Use `has()`
	 * to determine whether a key is present in the cache at all.
	 */
	public override get<T = V>(key: K, options?: GetOptions): T | undefined {
		return super.get(key, options) as T | undefined;
	}

	/**
	 * Like `get()` but doesn't update recency or delete stale items.
	 *
	 * Returns `undefined` if the item is stale, unless `allowStale` is set either on the cache or in the options object.
	 */
	public override peek<T = V>(key: K, options?: PeekOptions): T | undefined {
		return super.peek(key, options) as T | undefined;
	}

	/**
	 * Adds a value to the cache.
	 *
	 * The third parameter can be either a TTL number, or options object.
	 */
	public override set(key: K, value: V, ttl?: number): this;
	public override set(key: K, value: V, options?: SetOptions<K, V>): this;
	public override set(key: K, value: V, optionsOrTtl?: SetOptions<K, V> | number): this {
		optionsOrTtl = typeof optionsOrTtl === 'number' ? { ttl: optionsOrTtl } : optionsOrTtl;
		super.set(key, value, optionsOrTtl);
		return this;
	}

	/**
	 * Find a value for which the supplied callback function returns a truthy value, similar to `Array.find()`.
	 *
	 * The function is called as `fn(value, key, cache)`.
	 */
	public override find<T = V>(
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		callbackFn: (value: V, key: K, cache: this) => void | boolean | undefined,
		options?: GetOptions
	): T {
		return super.find(callbackFn, options) as T;
	}
}
