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
	 * If the method has arguments, you can use them to create a custom hash key.
	 *
	 * @param args Method arguments used to create the cache key. Must match the decorated method's signature.
	 */
	hashFunction?: (...args: any[]) => string;

	/**
	 * Allows the use of {@link CacheArgumentOptions} passed as the last argument in the decorated method
	 * to control caching behavior for a specific method call.
	 *
	 * @default false
	 */

	useArgumentOptions?: boolean;

	/**
	 * Enables the decorated method to use a shared cache across all instances of the class.
	 *
	 * By default, this behavior is applied unless the class is decorated with the {@link IsolatedCache} decorator.
	 * If the {@link IsolatedCache} decorator is applied but you want certain methods to use a shared cache
	 * across all class instances, set this option to `true` to enforce the shared cache behavior at the method level.
	 *
	 * @default false
	 */
	useSharedCache?: boolean;
}
