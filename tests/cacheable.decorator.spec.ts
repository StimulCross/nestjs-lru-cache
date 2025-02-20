import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { LruCacheModule } from '../src';
import { CacheableTestService } from './test-app/cacheable-test.service';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../src/constants';

describe('Cacheable decorator test suite', () => {
	let app: NestApplication;

	beforeEach(async () => {
		const TestingModule = await Test.createTestingModule({
			imports: [LruCacheModule.register({ max: 1 })],
			providers: [CacheableTestService]
		}).compile();

		app = TestingModule.createNestApplication();

		await app.init();
	});

	test('Cacheable class must has static "__CACHE_INSTANCES__" property', async () => {
		expect(Object.getOwnPropertySymbols(Object.getPrototypeOf(CacheableTestService))).toContain(
			CACHE_INSTANCES_PROPERTY
		);
		expect(typeof CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe('number');
	});

	test('Cacheable class must increment static "__CACHE_INSTANCES__" property on new instance creation', async () => {
		await app.resolve(CacheableTestService);
		expect(CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe(1);
		await app.resolve(CacheableTestService);
		expect(CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe(2);
	});

	test('Cacheable instance must has "__CACHE_INSTANCE_ID__" property', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(Object.getOwnPropertySymbols(cacheableTestService)).toContain(CACHE_INSTANCE_ID_PROPERTY);
		expect(typeof cacheableTestService[CACHE_INSTANCE_ID_PROPERTY]).toBe('number');
	});

	test('Cacheable instance "__CACHE_INSTANCE_ID__" property must be equal to the static "__CACHE_INSTANCES__" property', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(CacheableTestService[CACHE_INSTANCES_PROPERTY]).toBe(cacheableTestService[CACHE_INSTANCE_ID_PROPERTY]);
	});

	test('Cacheable instance must has DI injected cache service', async () => {
		const cacheableTestService = await app.resolve(CacheableTestService);
		expect(Object.getOwnPropertySymbols(cacheableTestService)).toContain(CACHE_INSTANCE);
	});
});
