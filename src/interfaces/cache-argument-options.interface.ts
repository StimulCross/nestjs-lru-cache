import { type LRUCache } from 'lru-cache';

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
export interface CacheArgumentOptions<K = unknown, V = unknown, FC = unknown>
	extends LRUCache.HasOptions<K, V, FC>,
		LRUCache.GetOptions<K, V, FC>,
		LRUCache.SetOptions<K, V, FC> {
	/**
	 * Whether to ignore the cached value.
	 *
	 * Set this to `true` to ignore the cached value and call the original method. The result of the method will
	 * replace the previous value in the cache as usual.
	 */
	ignoreCached?: boolean;

	/**
	 * Makes the decorated method to use the shared cache across multiple class instances for one specific method call.
	 *
	 * This overrides `useSharedCache` specified in decorator options. To make this option work you must set
	 * `useArgumentOptions` in {@link CachedDecoratorOptions} / {@link CachedAsyncDecoratorOptions} to `true`.
	 */
	useSharedCache?: boolean;

	/**
	 * Determines whether to delete a rejected Promise from the cache.
	 *
	 * If a cached Promise is rejected (fails to resolve), it will normally remain in the cache for the specified TTL,
	 * meaning any subsequent calls with the same cache key will return the same rejected Promise during this period.
	 *
	 * When this option is enabled (`true`), the rejected Promise will be immediately deleted from the cache.
	 * As a result, the next call with the same cache key will execute the original function again, potentially
	 * giving the opportunity to retry the operation or produce a different result.
	 *
	 * Use this option if you want to ensure that errors are not cached, allowing for retries or alternate handling
	 * of failures.
	 *
	 * @default false
	 */
	deleteRejectedPromise?: boolean;
}
