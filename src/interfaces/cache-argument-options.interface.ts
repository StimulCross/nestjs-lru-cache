import { type GetOptions, type HasOptions, type SetOptions, type SizeCalculator } from 'lru-cache';

/**
 * Additional cache options to pass as the last argument to the method decorated with {@link Cached} /
 * {@link CachedAsync} decorator to be able to control caching behavior for one specific method call.
 *
 * These options will override similar options in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}
 * and {@link LruCacheOptions}.
 *
 * To enable argument options usage, set the `useArgumentOptions` in the {@link CachedDecoratorOptions} /
 * {@link CachedAsyncDecoratorOptions} to `true`. As the result, the last method argument will be treated as the cache
 * options.
 *
 * @example
 * ```ts
 * class Test {
 * 		@Cached({ useArgumentOptions: true })
 * 		public getRandomNumber(options?: CacheOptionsArg): number {
 *     		return Math.random();
 * 		}
 * }
 *
 * const testInstance = new Test();
 *
 * const number = testInstance.getRandomNumber({
 *     updateAgeOnGet: true,
 *     ttl: 5000
 * });
 * ```
 */
export interface CacheArgumentOptions<K = unknown, V = unknown> extends HasOptions, GetOptions, SetOptions<K, V> {
	/**
	 * Whether to return the cached value.
	 *
	 * Set this to `false` to ignore cached value and call the original method. The resulting value will replace the
	 * previous one in the cache as usual.
	 *
	 * @default true
	 */
	returnCached?: boolean;

	/**
	 * Makes the decorated method to use the shared cache across multiple class instances for one specific method call.
	 *
	 * This overrides `useSharedCache` specified in decorator options. To make this option work you must set
	 * `useArgumentOptions` in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions} to `true`.
	 */
	useSharedCache?: boolean;

	/**
	 * A value for the size of the entry, prevents `sizeCalculation` function call.
	 */
	size?: number;

	/**
	 * A function to calculate size of items. Useful if storing strings or buffers or other items where memory size
	 * depends on the object itself.
	 *
	 * Also note that oversized items do NOT immediately get dropped from the cache, though they will cause faster
	 * turnover in the storage.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	sizeCalculation?: SizeCalculator<K, V>;

	/**
	 * Max time to live for items before they are considered stale. Note that stale items are NOT preemptively removed
	 * by default, and MAY live in the cache, contributing to its LRU max, long after they have expired.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	ttl?: number;

	/**
	 * Sets the effective start time for the TTL calculation. Note that this must be a previous value of
	 * `performance.now()` if supported, or a previous value of `Date.now()` if not.
	 */
	start?: number;

	/**
	 * Set to `true` to suppress calling the `dispose()` function if the entry key is still accessible within the cache.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	noDisposeOnSet?: boolean;

	/**
	 * Do not update the TTL when overwriting an existing item.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	noUpdateTTL?: boolean;

	/**
	 * Whether the age of an entry should be updated on `has()`.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	updateAgeOnHas?: boolean;

	/**
	 * Whether the age of an entry should be updated on `get()`.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	updateAgeOnGet?: boolean;

	/**
	 * Whether to not delete stale items when an entry is accessed with `get()`.
	 *
	 * Defaults to the value specified in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions}.
	 */
	noDeleteOnStaleGet?: boolean;
}
