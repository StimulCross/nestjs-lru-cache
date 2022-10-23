import type { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../src/lru-cache.constants';
import { LruCacheModule } from '../src/lru-cache.module';
import { LruCache } from '../src/providers/lru-cache';
import { CacheableTestService } from './test-app/cacheable-test.service';

describe('Cacheable decorator test suite', () => {
	let app: NestApplication;

	beforeEach(async () => {
		const TestingModule = await Test.createTestingModule({
			imports: [LruCacheModule.register({ max: 1 })],
			providers: [CacheableTestService]
		}).compile();

		app = TestingModule.createNestApplication();

		await app.init();
		await app.listen(3000);
	});

	afterEach(async () => {
		await app.close();
	});

	test('Cacheable class must has static "__cache_instances__" property', async () => {
		expect(CacheableTestService).toHaveProperty(CACHE_INSTANCES_PROPERTY);
	});

	test('Cacheable class must increment static "__cache_instances__" property on new instance creation', async () => {
		await app.resolve(CacheableTestService);
		expect(CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe(1);
		await app.resolve(CacheableTestService);
		expect(CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe(2);
	});

	test('Cacheable instance must has "__cache_instance_id__" property', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(cacheableTestService).toHaveProperty(CACHE_INSTANCE_ID_PROPERTY);
	});

	test('Cacheable instance must has "__cache_instance_id__" property', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(cacheableTestService).toHaveProperty(CACHE_INSTANCE_ID_PROPERTY);
	});

	test('Cacheable instance "__cache_instance_id__" property must be equal to the static "__cache_instances__" property', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe(cacheableTestService[CACHE_INSTANCE_ID_PROPERTY]);
	});

	test('Cacheable instance must has DI injected cache service', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(cacheableTestService).toHaveProperty(CACHE_INSTANCE);
		expect(cacheableTestService[CACHE_INSTANCE]).toBeInstanceOf(LruCache);
	});
});
