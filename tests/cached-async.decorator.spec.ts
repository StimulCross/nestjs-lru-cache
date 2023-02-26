import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { CacheableTestService } from './test-app/cacheable-test.service';
import { TestService } from './test-app/test.service';
import { sleep } from './test-app/utils/sleep';
import { LruCacheModule, LruCache } from '../src';
import { wrapCacheKey } from '../src/utils';

describe('Cached async decorator test suite', () => {
	let app: NestApplication;
	let cache: LruCache;

	beforeEach(async () => {
		const TestingModule = await Test.createTestingModule({
			imports: [LruCacheModule.register({ ttl: 1000, max: 1000 })],
			providers: [CacheableTestService, TestService]
		}).compile();

		app = TestingModule.createNestApplication();
		cache = app.get<LruCache>(LruCache);

		await app.init();
	});

	afterEach(async () => {
		cache.clear();
	});

	test('Cached async method should cache the promise', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);

		const promise = testService.getRandomNumberAsync();
		expect(cache.get(cachedKey)).toStrictEqual(promise);
	});

	test('Cached async method should not cache the promise if "cachePromise" set to false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithoutCachingPromise`);

		void testService.getRandomNumberAsyncWithoutCachingPromise();
		expect(cache.has(cachedKey)).toBe(false);
	});

	test('Cached async method should not cache the promise result if "cachePromiseResult" set to false in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithoutCachingPromiseResult`);

		const promise = testService.getRandomNumberAsyncWithoutCachingPromiseResult();
		expect(cache.has(cachedKey)).toBe(true);

		await promise;
		expect(cache.has(cachedKey)).toBe(false);
	});

	test('Cached async method should cache the promise result', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);
		const result = await testService.getRandomNumberAsync();
		expect(cache.get(cachedKey)).toBe(result);
	});

	test('Cached async method should cache the promise for specified TTL', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);

		void testService.getRandomNumberAsync();

		await sleep(110);

		expect(cache.get(cachedKey)).toBe(undefined);
	});

	test('Cached async method should update TTL after promise resolution', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncDelayed`);

		void testService.getRandomNumberAsyncDelayed();

		await sleep(50);

		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('Cached async method should not update TTL after promise resolution if "noUpdateTTL" specified in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncDelayedWithDisabledTtlUpdate`);

		void testService.getRandomNumberAsyncDelayedWithDisabledTtlUpdate();

		await sleep(51);

		expect(cache.getRemainingTTL(cachedKey)).toBeLessThanOrEqual(50);
	});

	test('Cached async method should return cached promise for next calls', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const promise1 = testService1.getRandomNumberAsync();
		const promise2 = testService2.getRandomNumberAsync();

		expect(promise1).toStrictEqual(promise2);
	});

	test('Cached async method should return cached promise result for next calls', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const promise1 = await testService1.getRandomNumberAsync();
		const promise2 = await testService2.getRandomNumberAsync();

		expect(promise1).toBe(promise2);
	});

	test('Cached method should cache promise independently for different instances of decorated class', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const promise1 = cacheableTestService1.getRandomNumberAsync();
		const promise2 = cacheableTestService2.getRandomNumberAsync();

		expect(await promise1).not.toBe(await promise2);
	});

	test('Cached async method should cache promise independently for different instances of decorated class', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const val1 = cacheableTestService1.getRandomNumberAsync();
		const val2 = cacheableTestService2.getRandomNumberAsync();

		expect(await val1).not.toBe(await val2);
	});

	test('Cached async method should use shared cache for different instances of decorated class if "useSharedCache" was set in decorator options', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const promise1 = cacheableTestService1.getRandomNumberAsyncShared();
		const promise2 = cacheableTestService2.getRandomNumberAsyncShared();

		expect(await promise1).toBe(await promise2);
	});

	test('Cached async method should ignore argument options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsync`);
		const promise = testService.getRandomNumberAsync({ ttl });

		await sleep(ttl + 1);

		expect(cache.get(cacheKey)).toBe(await promise);
	});

	test('Cached async method should use argument options if "useArgumentOptions" provided in decorator options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithOptions`);
		void testService.getRandomNumberAsyncWithOptions({ ttl });

		await sleep(ttl + 1);

		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('Cached async method should return new value if "returnCached" was set to `false` in argument options', async () => {
		const testService = await app.resolve(TestService);
		const promise1 = testService.getRandomNumberAsyncWithOptions();
		const promise2 = testService.getRandomNumberAsyncWithOptions();
		const promise3 = testService.getRandomNumberAsyncWithOptions({ returnCached: false });

		expect(await promise1).toBe(await promise2);
		expect(await promise1).not.toBe(await promise3);
	});

	test('Cached async method should return cached value if "returnCached" was set to `true` in argument options', async () => {
		const testService = await app.resolve(TestService);
		const promise1 = testService.getRandomNumberAsyncWithOptions();
		const promise2 = testService.getRandomNumberAsyncWithOptions({ returnCached: true });

		expect(await promise1).toBe(await promise2);
	});

	test('Cached async method should use shared cache across multiple instances if "useSharedCache" provided in argument options', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const promise1 = cacheableTestService1.getRandomNumberAsyncWithOptions({ useSharedCache: true });
		const promise2 = cacheableTestService2.getRandomNumberAsyncWithOptions({ useSharedCache: true });

		expect(await promise1).toBe(await promise2);
	});

	test('Cached async method should update TTL if "updateAgeOnGet" specified in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithEnabledTtlUpdateAsync`);

		void testService.getRandomNumberWithEnabledTtlUpdateAsync();
		await sleep(50);
		void testService.getRandomNumberWithEnabledTtlUpdateAsync();
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('Cached async method should update TTL if "updateAgeOnGet" specified in argument options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberAsyncWithOptions`);

		void testService.getRandomNumberAsyncWithOptions();
		await sleep(50);
		void testService.getRandomNumberAsyncWithOptions({ updateAgeOnGet: true });
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('Cached async method should use hash function overload in decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOverloadAsync:${a}_${b}`);
		const promise = testService.addHashFunctionOverloadAsync(a, b);

		expect(cache.has(cacheKey)).toBe(true);
		expect(await promise).toBe(a + b);
	});

	test('Cached async method should use TTL overload in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberTtlOverloadAsync`);
		const val = await testService.getRandomNumberTtlOverloadAsync();
		expect(cache.get(cacheKey)).toBe(val);

		await sleep(51);
		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('Cached async method should use hash function in decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOptionsAsync:${a}_${b}`);
		const promise = testService.addHashFunctionOptionsAsync(a, b);

		expect(cache.has(cacheKey)).toBe(true);
		expect(await promise).toBe(a + b);
	});
});
