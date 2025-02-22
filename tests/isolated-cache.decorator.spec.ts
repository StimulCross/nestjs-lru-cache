import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { LruCacheModule } from '../src';
import { IsolatedCacheTestService } from './test-app/isolated-cache-test.service';
import { CACHE_INSTANCE, CACHE_INSTANCE_ID_PROPERTY, CACHE_INSTANCES_PROPERTY } from '../src/constants';

describe('IsolatedCache decorator test suite', () => {
	let app: NestApplication;

	beforeEach(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [LruCacheModule.register({ max: 1 })],
			providers: [IsolatedCacheTestService],
		}).compile();

		app = testingModule.createNestApplication();

		await app.init();
	});

	test('should have a static "__CACHE_INSTANCES__" property on the IsolatedCache class', async () => {
		expect(Object.getOwnPropertySymbols(Object.getPrototypeOf(IsolatedCacheTestService))).toContain(
			CACHE_INSTANCES_PROPERTY,
		);
		expect(typeof IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe('number');
	});

	test('should increment the static "__CACHE_INSTANCES__" property when a new instance is created', async () => {
		await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(1);
		await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(2);
	});

	test('should have a "__CACHE_INSTANCE_ID__" property on the IsolatedCache instance', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(Object.getOwnPropertySymbols(isolatedCacheTestService)).toContain(CACHE_INSTANCE_ID_PROPERTY);
		expect(typeof isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY]).toBe('number');
	});

	test('should have the "__CACHE_INSTANCE_ID__" property equal to the static "__CACHE_INSTANCES__" property', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(
			isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY],
		);
	});

	test('should have a DI injected cache service on the IsolatedCache instance', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(Object.getOwnPropertySymbols(isolatedCacheTestService)).toContain(CACHE_INSTANCE);
	});
});
