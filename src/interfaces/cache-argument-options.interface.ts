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
}
