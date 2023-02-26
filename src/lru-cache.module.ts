import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import * as LRUCache from 'lru-cache';
import { LRU_CACHE, LRU_CACHE_OPTIONS } from './constants';
import {
	type LruCacheAsyncModuleOptions,
	type LruCacheModuleOptions,
	type LruCacheOptions,
	type LruCacheOptionsFactory
} from './interfaces';
import { LruCache } from './providers';

/**
 * LRU cache module.
 *
 * Must be registered using on of the following static methods:
 * - `register` - Registers the module synchronously.
 * - `registerAsync` - Registers the module asynchronously.
 */
@Module({})
export class LruCacheModule {
	/**
	 * Registers the LRU cache module synchronously.
	 *
	 * @param options LRU cache options.
	 */
	public static register(options: LruCacheModuleOptions): DynamicModule {
		const optionsProvider: Provider<LruCacheModuleOptions> = {
			provide: LRU_CACHE_OPTIONS,
			useValue: options
		};

		const ttlCacheProvider: Provider<LRUCache<unknown, unknown>> = {
			provide: LRU_CACHE,
			useValue: new LRUCache(options)
		};

		return {
			global: options.isGlobal,
			module: LruCacheModule,
			providers: [optionsProvider, ttlCacheProvider, LruCache],
			exports: [ttlCacheProvider, LruCache]
		};
	}

	/**
	 * Registers the LRU cache module asynchronously.
	 *
	 * Requires one of the following factories: `useFactory`, `useClass`, or `useExisting`.
	 *
	 * @param options LRU cache async options.
	 */
	public static async registerAsync(options: LruCacheAsyncModuleOptions): Promise<DynamicModule> {
		const ttlCacheProvider: Provider<LRUCache<unknown, unknown>> = {
			provide: LRU_CACHE,
			useFactory: (opts: LruCacheOptions) => new LRUCache(opts),
			inject: [LRU_CACHE_OPTIONS]
		};

		return {
			global: options.isGlobal,
			imports: options.imports ?? [],
			module: LruCacheModule,
			providers: [...LruCacheModule._createOptionsProviders(options), ttlCacheProvider, LruCache],
			exports: [ttlCacheProvider, LruCache]
		};
	}

	private static _createOptionsProviders(options: LruCacheAsyncModuleOptions): Provider[] {
		if (options.useExisting || options.useFactory) {
			return [LruCacheModule._createOptionsProvider(options)];
		}

		return [
			LruCacheModule._createOptionsProvider(options),
			{
				provide: options.useClass!,
				useClass: options.useClass!
			}
		];
	}

	private static _createOptionsProvider(options: LruCacheAsyncModuleOptions): Provider<LruCacheOptions> {
		if (options.useFactory) {
			return {
				provide: LRU_CACHE_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject ?? []
			};
		}

		return {
			provide: LRU_CACHE_OPTIONS,
			useFactory: async (factory: LruCacheOptionsFactory) => await factory.createLruCacheOptions(),
			inject: [options.useExisting ?? options.useClass!]
		};
	}
}
