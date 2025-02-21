import { Injectable, Scope } from '@nestjs/common';
import { IsolatedCache, Cached, CachedAsync, type CacheArgumentOptions } from '../../src';
import { CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../../src/constants';

@Injectable({ scope: Scope.TRANSIENT })
@IsolatedCache()
export class IsolatedCacheTestService {
	// Just to suppress warnings...
	static [CACHE_INSTANCES_PROPERTY]: number;
	[CACHE_INSTANCE_ID_PROPERTY]!: number;

	@Cached({ ttl: 100 })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getRandomNumber(options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@Cached({ ttl: 100, useSharedCache: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getRandomNumberShared(options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@Cached({ ttl: 100, useArgumentOptions: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getRandomNumberWithOptions(options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 100 })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getRandomNumberAsync(options?: CacheArgumentOptions): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, useSharedCache: true })
	public async getRandomNumberAsyncShared(): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, useArgumentOptions: true })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getRandomNumberAsyncWithOptions(options?: CacheArgumentOptions): Promise<number> {
		return Math.random();
	}
}
