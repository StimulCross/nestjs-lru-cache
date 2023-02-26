import { type LruCacheOptions } from './lru-cache-options.interface';

/**
 * Class with factory method to create {@link LruCacheOptions}.
 */
export interface LruCacheOptionsFactory {
	/**
	 * Factory method that creates {@link LruCacheOptions}.
	 */
	createLruCacheOptions(): Promise<LruCacheOptions> | LruCacheOptions;
}
