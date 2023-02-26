import { type CachedDecoratorOptions } from './cached-decorator-options.interface';

/**
 * Options for {@link CachedAsync} decorator.
 *
 * These options will override similar options in {@link LruCacheOptions} for specific async method.
 */
export interface CachedAsyncDecoratorOptions<K = any, V = any> extends CachedDecoratorOptions<K, V> {
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
}
