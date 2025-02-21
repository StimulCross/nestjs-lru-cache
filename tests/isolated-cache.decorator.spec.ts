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

	test('IsolatedCache class must has static "__CACHE_INSTANCES__" property', async () => {
		expect(Object.getOwnPropertySymbols(Object.getPrototypeOf(IsolatedCacheTestService))).toContain(
			CACHE_INSTANCES_PROPERTY,
		);
		expect(typeof IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe('number');
	});

	test('IsolatedCache class must increment static "__CACHE_INSTANCES__" property on new instance creation', async () => {
		await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(1);
		await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(2);
	});

	test('IsolatedCache instance must has "__CACHE_INSTANCE_ID__" property', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(Object.getOwnPropertySymbols(isolatedCacheTestService)).toContain(CACHE_INSTANCE_ID_PROPERTY);
		expect(typeof isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY]).toBe('number');
	});

	test('IsolatedCache instance "__CACHE_INSTANCE_ID__" property must be equal to the static "__CACHE_INSTANCES__" property', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(IsolatedCacheTestService[CACHE_INSTANCES_PROPERTY]).toBe(
			isolatedCacheTestService[CACHE_INSTANCE_ID_PROPERTY],
		);
	});

	test('IsolatedCache instance must has DI injected cache service', async () => {
		const isolatedCacheTestService = await app.resolve(IsolatedCacheTestService);
		expect(Object.getOwnPropertySymbols(isolatedCacheTestService)).toContain(CACHE_INSTANCE);
	});
});
