import { setTimeout as sleep } from 'node:timers/promises';
import { Logger } from '@nestjs/common';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { type LRUCache } from 'lru-cache';
import { LRU_CACHE, LruCacheModule } from '../src';
import { IsolatedCacheTestService } from './test-app/isolated-cache-test.service';
import { NonInjectableCacheService } from './test-app/non-ijectable-cache.service';
import { TestService } from './test-app/test.service';
import { wrapCacheKey } from '../src/utils';

describe('Cached async decorator test suite', () => {
	let app: NestApplication;
	let cache: LRUCache<any, any>;

	beforeEach(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [LruCacheModule.register({ ttl: 1000, max: 1000 })],
			providers: [IsolatedCacheTestService, TestService],
		}).compile();

		app = testingModule.createNestApplication();
		cache = app.get<LRUCache<any, any>>(LRU_CACHE);

		await app.init();
	});

	afterEach(async () => {
		cache.clear();
	});

	test('should cache the promise', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);

		const promise = testService.getRandomNumberAsync();
		expect(cache.get(cachedKey)).toStrictEqual(promise);
	});

	test('should cache the promise result', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);
		const result = await testService.getRandomNumberAsync();
		expect(cache.get(cachedKey)).toBe(result);
	});

	test('should not cache the promise if "cachePromise" set to false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithoutCachingPromise`);

		void testService.getRandomNumberAsyncWithoutCachingPromise();
		expect(cache.has(cachedKey)).toBe(false);
	});

	test('should not cache the promise result if "cachePromiseResult" set to false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithoutCachingPromiseResult`);

		const promise = testService.getRandomNumberAsyncWithoutCachingPromiseResult();
		expect(cache.has(cachedKey)).toBe(true);

		await promise;
		expect(cache.has(cachedKey)).toBe(false);
	});

	test('should cache the promise for specified TTL', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);

		void testService.getRandomNumberAsync();

		await sleep(110);

		expect(cache.get(cachedKey)).toBe(undefined);
	});

	test('should update TTL after promise resolution', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncDelayed`);

		void testService.getRandomNumberAsyncDelayed();

		await sleep(50);

		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('should not update TTL after promise resolution if "noUpdateTTL" specified in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncDelayedWithDisabledTtlUpdate`);

		void testService.getRandomNumberAsyncDelayedWithDisabledTtlUpdate();

		await sleep(51);

		expect(cache.getRemainingTTL(cachedKey)).toBeLessThanOrEqual(50);
	});

	test('should return cached promise for subsequent calls', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const promise1 = testService1.getRandomNumberAsync();
		const promise2 = testService2.getRandomNumberAsync();

		expect(promise1).toStrictEqual(promise2);
	});

	test('should return cached promise result for subsequent calls', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const promise1 = await testService1.getRandomNumberAsync();
		const promise2 = await testService2.getRandomNumberAsync();

		expect(promise1).toBe(promise2);
	});

	test('should cache promise independently for different instances of @IsolatedCache class', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const promise1 = isolatedCacheTestService1.getRandomNumberAsync();
		const promise2 = isolatedCacheTestService2.getRandomNumberAsync();

		expect(await promise1).not.toBe(await promise2);
	});

	test('should cache promise independently for different instances of @IsolatedCache class', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const val1 = isolatedCacheTestService1.getRandomNumberAsync();
		const val2 = isolatedCacheTestService2.getRandomNumberAsync();

		expect(await val1).not.toBe(await val2);
	});

	test('should use shared cache for different instances of @IsolatedCache class if "useSharedCache" was set in decorator options', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const promise1 = isolatedCacheTestService1.getRandomNumberAsyncShared();
		const promise2 = isolatedCacheTestService2.getRandomNumberAsyncShared();

		expect(await promise1).toBe(await promise2);
	});

	test('should ignore argument options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);
		const promise = testService.getRandomNumberAsync({ ttl });

		await sleep(ttl + 1);

		expect(cache.get(cacheKey)).toBe(await promise);
	});

	test('should use argument options if "useArgumentOptions" provided in decorator options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithOptions`);
		void testService.getRandomNumberAsyncWithOptions({ ttl });

		await sleep(ttl + 1);

		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('should return new value if "ignoreCached" was set to true in argument options', async () => {
		const testService = await app.resolve(TestService);
		const promise1 = testService.getRandomNumberAsyncWithOptions();
		const promise2 = testService.getRandomNumberAsyncWithOptions();
		const promise3 = testService.getRandomNumberAsyncWithOptions({ ignoreCached: true });

		expect(await promise1).toBe(await promise2);
		expect(await promise1).not.toBe(await promise3);
	});

	test('should return cached value if "ignoreCached" is falsy in argument options', async () => {
		const testService = await app.resolve(TestService);
		const promise1 = testService.getRandomNumberAsyncWithOptions();
		const promise2 = testService.getRandomNumberAsyncWithOptions({ ignoreCached: false });

		expect(await promise1).toBe(await promise2);
	});

	test('should use shared cache across multiple instances if "useSharedCache" provided in argument options', async () => {
		const isolatedCacheTestService1 = await app.resolve(IsolatedCacheTestService);
		const isolatedCacheTestService2 = await app.resolve(IsolatedCacheTestService);

		const promise1 = isolatedCacheTestService1.getRandomNumberAsyncWithOptions({ useSharedCache: true });
		const promise2 = isolatedCacheTestService2.getRandomNumberAsyncWithOptions({ useSharedCache: true });

		expect(await promise1).toBe(await promise2);
	});

	test('should update TTL if "updateAgeOnGet" specified in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithEnabledTtlUpdateAsync`);

		void testService.getRandomNumberWithEnabledTtlUpdateAsync();
		await sleep(50);
		void testService.getRandomNumberWithEnabledTtlUpdateAsync();
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('should use hash function overload', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOverloadAsync:${a}_${b}`);
		const promise = testService.addHashFunctionOverloadAsync(a, b);

		expect(cache.has(cacheKey)).toBe(true);
		expect(await promise).toBe(a + b);
	});

	test('should use TTL overload', async () => {
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberTtlOverloadAsync`);
		const val = await testService.getRandomNumberTtlOverloadAsync();
		expect(cache.get(cacheKey)).toBe(val);

		await sleep(51);
		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('should use hash function in decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOptionsAsync:${a}_${b}`);
		const promise = testService.addHashFunctionOptionsAsync(a, b);

		expect(cache.has(cacheKey)).toBe(true);
		expect(await promise).toBe(a + b);
	});

	test('should print warning and call original function if the class is not registered in providers', async () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

		const service = new NonInjectableCacheService();
		await service.getRandomNumberAsync();

		expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
		expect(loggerWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				'Failed to get the cache instance in method NonInjectableCacheService.getRandomNumberAsync()',
			),
		);

		loggerWarnSpy.mockRestore();
	});

	test('should cache a rejected promise and return the same error for multiple calls if "deleteRejectedPromise" is false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithError`);

		await expect(testService.getRandomNumberAsyncWithError()).rejects.toThrow('Simulated error');

		const cachedPromise = cache.get(cachedKey);

		expect(cachedPromise).toBeInstanceOf(Promise);
		await expect(cachedPromise).rejects.toThrow('Simulated error');

		const promise2 = testService.getRandomNumberAsyncWithError();
		await expect(promise2).rejects.toThrow('Simulated error');
	});

	test('should delete a rejected promise from cache if "deleteRejectedPromise" is "true" in decorator options', async () => {
		// Включаем опцию deleteRejectedPromise.
		const testService = await app.resolve(TestService);
		const spy = jest.spyOn(cache, 'delete');
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithErrorAndDeletedPormise`);

		try {
			await testService.getRandomNumberAsyncWithErrorAndDeletedPormise();
		} catch {
			expect(spy).toHaveBeenCalledWith(cachedKey);
			expect(cache.has(cachedKey)).toBe(false);
		}

		spy.mockRestore();
	});

	test('should delete a rejected promise from cache if "deleteRejectedPromise" is falsy in argument options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithError`);

		await expect(testService.getRandomNumberAsyncWithError()).rejects.toThrow('Simulated error');

		const cachedPromise = cache.get(cachedKey);

		expect(cachedPromise).toBeInstanceOf(Promise);
		await expect(cachedPromise).rejects.toThrow('Simulated error');

		const promise2 = testService.getRandomNumberAsyncWithError();
		await expect(promise2).rejects.toThrow('Simulated error');
	});

	test('should delete a rejected promise from cache if "deleteRejectedPromise" is "true" in argument options', async () => {
		const testService = await app.resolve(TestService);
		const spy = jest.spyOn(cache, 'delete');
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithErrorWithArgumentOptions`);

		try {
			await testService.getRandomNumberAsyncWithErrorWithArgumentOptions({ deleteRejectedPromise: true });
		} catch {
			expect(spy).toHaveBeenCalledWith(cachedKey);
			expect(cache.has(cachedKey)).toBe(false);
		}

		spy.mockRestore();
	});
});
