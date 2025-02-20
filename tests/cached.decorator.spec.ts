import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { LruCacheModule, LruCache } from '../src';
import { CacheableTestService } from './test-app/cacheable-test.service';
import { TestService } from './test-app/test.service';
import { CACHE_INSTANCE_ID_PROPERTY } from '../src/constants';
import { wrapCacheKey } from '../src/utils';
import { sleep } from './test-app/utils/sleep';

describe('Cached decorator test suite', () => {
	let app: NestApplication;
	let cache: LruCache;

	beforeEach(async () => {
		const TestingModule = await Test.createTestingModule({
			imports: [LruCacheModule.register({ isGlobal: true, ttl: 1000, max: 1000 })],
			providers: [CacheableTestService, TestService]
		}).compile();

		app = TestingModule.createNestApplication();
		cache = app.get(LruCache);

		await app.init();
	});

	afterEach(async () => {
		cache.clear();
	});

	test('Cached getter should cache the result', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberGetter`);
		const val = testService.getRandomNumberGetter;
		expect(cache.get(cachedKey)).toBe(val);
	});

	test('Cached method should generate expected cache keys', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey('TestService.getRandomNumber');

		testService.getRandomNumber();

		expect(cache.has(cachedKey)).toBe(true);
	});

	test('Cached method should generate expected cache keys for cacheable class', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);
		const cachedKey1 = wrapCacheKey('CacheableTestService_1.getRandomNumber');
		const cachedKey2 = wrapCacheKey('CacheableTestService_2.getRandomNumber');

		cacheableTestService1.getRandomNumber();
		cacheableTestService2.getRandomNumber();

		expect(cache.has(cachedKey1)).toBe(true);
		expect(cache.has(cachedKey2)).toBe(true);
	});

	test('Cached method should cache the result', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		const cachedKey = wrapCacheKey(
			`${CacheableTestService.name}_${cacheableTestService[CACHE_INSTANCE_ID_PROPERTY]}.getRandomNumber`
		);

		const val = cacheableTestService.getRandomNumber();
		expect(cache.get(cachedKey)).toBe(val);
	});

	test('Cached method should cache the result only for the specified TTL', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		const cachedKey = wrapCacheKey(
			`${CacheableTestService.name}_${cacheableTestService[CACHE_INSTANCE_ID_PROPERTY]}.getRandomNumber`
		);

		const val = cacheableTestService.getRandomNumber();
		expect(cache.get(cachedKey)).toBe(val);

		await sleep(110);

		expect(cache.get(cachedKey)).toBe(undefined);

		const newVal = cacheableTestService.getRandomNumber();
		expect(newVal).not.toBe(val);
	});

	test('Cached method should update TTL if "updateAgeOnGet" specified in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithEnabledTtlUpdate`);

		testService.getRandomNumberWithEnabledTtlUpdate();
		await sleep(50);
		testService.getRandomNumberWithEnabledTtlUpdate();
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('Cached method should update TTL if "updateAgeOnGet" specified in argument options', async () => {
		const testService = await app.resolve(TestService);
		const cachedKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithOptions`);

		testService.getRandomNumberWithOptions();
		await sleep(50);
		testService.getRandomNumberWithOptions({ updateAgeOnGet: true });
		expect(cache.getRemainingTTL(cachedKey)).toBeGreaterThan(90);
	});

	test('Cached method should use separate cache for different instances of the decorated class', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const val1 = cacheableTestService1.getRandomNumber();
		const val2 = cacheableTestService2.getRandomNumber();

		expect(val1).not.toBe(val2);
	});

	test('Cached method should use shared cache for different instances of decorated class if "useSharedCache" was set in decorator options', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const val1 = cacheableTestService1.getRandomNumberShared();
		const val2 = cacheableTestService2.getRandomNumberShared();

		expect(val1).toBe(val2);
	});

	test('Cached method should use shared cache for different instances of non-decorated class', async () => {
		const testService1 = await app.resolve(TestService);
		const testService2 = await app.resolve(TestService);

		const val1 = testService1.getRandomNumber();
		const val2 = testService2.getRandomNumber();

		expect(val1).toBe(val2);
	});

	test('Cached method should ignore argument options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumber`);
		const val = testService.getRandomNumber({ ttl });

		await sleep(ttl + 10);

		expect(cache.get(cacheKey)).toBe(val);
	});

	test('Cached method should use argument options if "useArgumentOptions" provided in decorator options', async () => {
		const ttl = 50;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberWithOptions`);
		testService.getRandomNumberWithOptions({ ttl });

		await sleep(ttl + 10);

		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('Cached method should return new value if "returnCached" was set to `false` in argument options', async () => {
		const testService = await app.resolve(TestService);
		const val1 = testService.getRandomNumberWithOptions();
		const val2 = testService.getRandomNumberWithOptions({ returnCached: false });

		expect(val2).not.toBe(val1);
	});

	test('Cached method should return cached value if "returnCached" was set to `true` in argument options', async () => {
		const testService = await app.resolve(TestService);
		const val1 = testService.getRandomNumberWithOptions();
		const val2 = testService.getRandomNumberWithOptions({ returnCached: true });

		expect(val2).toBe(val1);
	});

	test('Cached method should use shared cache across multiple instances if "useSharedCache" provided in argument options', async () => {
		const cacheableTestService1 = await app.resolve(CacheableTestService);
		const cacheableTestService2 = await app.resolve(CacheableTestService);

		const val1 = cacheableTestService1.getRandomNumberWithOptions({ useSharedCache: true });
		const val2 = cacheableTestService2.getRandomNumberWithOptions({ useSharedCache: true });

		expect(val2).toBe(val1);
	});

	test('Cached method should use hash function overload in decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOverload:${a}_${b}`);
		testService.addHashFunctionOverload(a, b);

		expect(cache.get(cacheKey)).toBe(a + b);
	});

	test('Cached method should use TTL overload in decorator options', async () => {
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.getRandomNumberTtlOverload`);
		const val = testService.getRandomNumberTtlOverload();
		expect(cache.get(cacheKey)).toBe(val);

		await sleep(51);
		expect(cache.get(cacheKey)).toBe(undefined);
	});

	test('Cached method should use hash function in decorator options', async () => {
		const a = 5;
		const b = 5;
		const testService = await app.resolve(TestService);
		const cacheKey = wrapCacheKey(`${TestService.name}.addHashFunctionOptions:${a}_${b}`);
		testService.addHashFunctionOptions(a, b);

		expect(cache.get(cacheKey)).toBe(a + b);
	});
});
