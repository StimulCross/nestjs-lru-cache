import { type ModuleMetadata, type Type } from '@nestjs/common';
import { type LruCacheOptionsFactory } from './lru-cache-options-factory.interface';
import { type LruCacheOptions } from './lru-cache-options.interface';

/**
 * Additional module options.
 */
export interface LruCacheModuleExtraOptions {
	/**
	 * Whether the module should be global.
	 */
	isGlobal?: boolean;
}

/**
 * LRU cache module options.
 */
export type LruCacheModuleOptions<K = any, V = any> = LruCacheModuleExtraOptions & LruCacheOptions<K, V>;

/**
 * LRU cache module async options.
 */
export interface LruCacheAsyncModuleOptions extends LruCacheModuleExtraOptions, Pick<ModuleMetadata, 'imports'> {
	/**
	 * Dependencies that a Factory may inject.
	 */
	inject?: any[];

	/**
	 * Injection token resolving to a class that will be instantiated as a provider.
	 *
	 * The class must implement the corresponding interface.
	 */
	useClass?: Type<LruCacheOptionsFactory>;

	/**
	 * Injection token resolving to an existing provider.
	 *
	 * The provider must implement the corresponding interface.
	 */
	useExisting?: Type<LruCacheOptionsFactory>;

	/**
	 * Function returning options (or a Promise resolving to options) to configure the cache module.
	 */
	useFactory?: (...args: any[]) => Promise<LruCacheOptions> | LruCacheOptions;
}
