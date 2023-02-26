import { type GetOptions, type SetOptions, type SizeCalculator } from 'lru-cache';

/**
 * Options for {@link CachedAsync} decorator.
 *
 * These options will override similar options in {@link LruCacheOptions} for specific async method.
 */
export interface CachedAsyncDecoratorOptions<K = any, V = any> extends GetOptions, Omit<SetOptions<K, V>, 'size'> {
	/**
	 * Custom hash function.
	 *
	 * If the method has arguments you can use them to create a custom hash key.
	 *
	 * @param args Method arguments to create the cache key from. Accepts the same params as the decorated method.
	 */
	hashFunction?: (...args: any[]) => string;

	/**
	 * Uses {@link CacheArgumentOptions} passed as the last argument in the decorated method to control caching behavior
	 * for one specific method call.
	 *
	 * @default false
	 */
	useArgumentOptions?: boolean;

	/**
	 * Makes the decorated method to use the shared cache across all instances of the class.
	 *
	 * This is the default behavior unless you have applied {@link Cacheable} decorator on the class.
	 * If you have applied {@link Cacheable} decorator, but you want to force some methods to use the shared cache
	 * across all class instances, you can set this option to `true` to enable such behavior on the decorated method
	 * level.
	 *
	 * @default false
	 */
	useSharedCache?: boolean;

	/**
	 * Caches a promise returned by a decorated async method until it will be resolved.
	 *
	 * If the decorated method will be called multiple times, the first call will cache the promise, and all subsequent
	 * calls will return the cached promise instead of creating a new one.
	 *
	 * This behavior would be useful to call rate-limited third-party APIs to avoid wasting limits, or for complex
	 * database queries to maintain performance.
	 *
	 * After the promise resolution the result will also be cached. In order to not cache the promise result, you can
	 * set `cachePromiseResult` in {@link CachedAsyncDecoratorOptions} to `false`.
	 *
	 * When the promise result is caching, the TTL resets to the specified number in {@link CachedAsyncDecoratorOptions},
	 * or to the number specified in {@link LruCacheOptions}. If you want the promise and its result to live
	 * within the same TTL number, you can set `noUpdateTTL` option in {@link CachedAsyncDecoratorOptions} to `true`.
	 *
	 * @default true
	 */
	cachePromise?: boolean;

	/**
	 * Caches the promise result after the promise resolution.
	 *
	 * When the promise result is caching, the TTL resets to the specified number in {@link CachedAsyncDecoratorOptions},
	 * or to the number specified in {@link LruCacheOptions}. If you want the promise and its result to live
	 * within one TTL, you can set `noUpdateTTL` option in {@link CachedAsyncDecoratorOptions} to `true`.
	 *
	 * @default true
	 */
	cachePromiseResult?: boolean;

	/**
	 * A function to calculate size of items. Useful if storing strings or buffers or other items where memory size
	 * depends on the object itself.
	 *
	 * Also note that oversized items do NOT immediately get dropped from the cache, though they will cause faster
	 * turnover in the storage.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	sizeCalculation?: SizeCalculator<K, V>;

	/**
	 * Max time to live for items before they are considered stale. Note that stale items are NOT preemptively removed
	 * by default, and MAY live in the cache, contributing to its LRU max, long after they have expired.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	ttl?: number;

	/**
	 * Set to `true` to suppress calling the `dispose()` function if the entry
	 * key is still accessible within the cache.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}
	 */
	noDisposeOnSet?: boolean;

	/**
	 * Do not update the TTL when overwriting an existing item.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	noUpdateTTL?: boolean;

	/**
	 * Whether the age of an item should be updated on `has()` check.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	updateAgeOnHas?: boolean;

	/**
	 * Whether the age of an item should be updated on retrieving.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	updateAgeOnGet?: boolean;

	/**
	 * Whether to not delete stale items when the key is accessed with `get()`.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	noDeleteOnStaleGet?: boolean;
}
