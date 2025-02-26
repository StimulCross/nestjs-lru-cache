import { setTimeout as sleep } from 'node:timers/promises';
import { Injectable, Scope } from '@nestjs/common';
import { Cached, CachedAsync, type CacheArgumentOptions } from '../../src';
import { CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../../src/constants';

@Injectable({ scope: Scope.TRANSIENT })
export class TestService {
	// Just to suppress warnings...
	static [CACHE_INSTANCES_PROPERTY]: number;
	[CACHE_INSTANCE_ID_PROPERTY]!: number;

	@Cached()
	public get getRandomNumberGetter(): number {
		return Math.random();
	}

	@Cached({ ttl: 100 })
	public getRandomNumber(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@Cached({ ttl: 100, updateAgeOnGet: true })
	public getRandomNumberWithEnabledTtlUpdate(): number {
		return Math.random();
	}

	@Cached({ ttl: 100, useArgumentOptions: true })
	public getRandomNumberWithOptions(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@Cached()
	public getUserById(id: string): string {
		return id;
	}

	@Cached({ useArgumentOptions: true })
	public getUserByIdWithOptions(id: string): string {
		return id;
	}

	@Cached((a: number, b: number) => `${a}_${b}`)
	public addHashFunctionOverload(a: number, b: number): number {
		return a + b;
	}

	@Cached(50)
	public getRandomNumberTtlOverload(): number {
		return Math.random();
	}

	@Cached({ hashFunction: (a: number, b: number) => `${a}_${b}` })
	public addHashFunctionOptions(a: number, b: number): number {
		return a + b;
	}

	@CachedAsync({ ttl: 100 })
	public async getRandomNumberAsync(_options?: CacheArgumentOptions): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, cachePromise: false })
	public async getRandomNumberAsyncWithoutCachingPromise(): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, cachePromiseResult: false })
	public async getRandomNumberAsyncWithoutCachingPromiseResult(): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100 })
	public async getRandomNumberAsyncDelayed(): Promise<number> {
		await sleep(50);
		return Math.random();
	}

	@CachedAsync({ ttl: 100, noUpdateTTL: true })
	public async getRandomNumberAsyncDelayedWithDisabledTtlUpdate(): Promise<number> {
		await sleep(50);
		return Math.random();
	}

	@CachedAsync({ ttl: 100, useArgumentOptions: true })
	public async getRandomNumberAsyncWithOptions(_options?: CacheArgumentOptions): Promise<number> {
		return Math.random();
	}

	@CachedAsync()
	public async getUserByIdAsync(id: string): Promise<string> {
		return id;
	}

	@CachedAsync({ useArgumentOptions: true })
	public async getUserByIdWithOptionsAsync(id: string): Promise<string> {
		return id;
	}

	@CachedAsync((a: number, b: number) => `${a}_${b}`)
	public async addHashFunctionOverloadAsync(a: number, b: number): Promise<number> {
		return a + b;
	}

	@CachedAsync({ hashFunction: (a: number, b: number) => `${a}_${b}` })
	public async addHashFunctionOptionsAsync(a: number, b: number): Promise<number> {
		return a + b;
	}

	@CachedAsync(50)
	public async getRandomNumberTtlOverloadAsync(): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100, updateAgeOnGet: true })
	public async getRandomNumberWithEnabledTtlUpdateAsync(): Promise<number> {
		return Math.random();
	}

	@CachedAsync({ ttl: 100 })
	public async getRandomNumberAsyncWithError(): Promise<number> {
		throw new Error('Simulated error');
	}

	@CachedAsync({ ttl: 100, deleteRejectedPromise: true })
	public async getRandomNumberAsyncWithErrorAndDeletedPormise(): Promise<number> {
		throw new Error('Simulated error');
	}

	@CachedAsync({ ttl: 100, useArgumentOptions: true })
	public async getRandomNumberAsyncWithErrorWithArgumentOptions(_options?: CacheArgumentOptions): Promise<number> {
		throw new Error('Simulated error');
	}
}
