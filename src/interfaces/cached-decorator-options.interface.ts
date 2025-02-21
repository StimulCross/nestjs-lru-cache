import { type LRUCache } from 'lru-cache';

/**
 * Options for {@link Cached} decorator.
 *
 * These options will override similar options in {@link LruCacheOptions} for specific method or getter.
 */
export interface CachedDecoratorOptions<K = any, V = any, FC = unknown>
	extends LRUCache.HasOptions<K, V, FC>,
		LRUCache.GetOptions<K, V, FC>,
		LRUCache.SetOptions<K, V, FC> {
	/**
	 * Custom hash function.
	 *
	 * If the method has arguments you can use them to create a custom hash key.
	 *
	 * @param args Method arguments to create the cache key from. Must match the decorated method signature.
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
	 * A value for the size of the entry, prevents calls to {@link sizeCalculation}.
	 *
	 * Items larger than {@link LruCacheOptions#maxEntrySize} will not be stored in the cache.
	 *
	 * Note that when {@link LruCacheOptions#maxSize} or {@link LruCacheOptions#maxEntrySize} are set, every item added
	 * MUST have a size specified, either via a {@link sizeCalculation} or {@link size} options to set.
	 */
	size?: number;

	/**
	 * A function to calculate size of items. Useful if storing strings or buffers or other items where memory size
	 * depends on the object itself.
	 *
	 * Also note that oversized items do NOT immediately get dropped from the cache, though they will cause faster
	 * turnover in the storage.
	 *
	 * Defaults to the value specified in the {@link LruCacheOptions}.
	 */
	sizeCalculation?: LRUCache.SizeCalculator<K, V>;

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
