import { Test } from '@nestjs/testing';
import type { NestApplication } from '@nestjs/core';
import * as LRUCache from 'lru-cache';
import type { INestApplication } from '@nestjs/common';
import { LRU_CACHE, LRU_CACHE_OPTIONS } from '../src/constants';
import { LruCacheModule } from '../src/lru-cache.module';
import type { LruCacheOptions } from '../src/interfaces/lru-cache-options.interface';
import { LruCache } from '../src/providers/lru-cache';
import { OptionsFactoryModule } from './test-app/options-factory/options-factory.module';
import { OptionsFactory } from './test-app/options-factory/options-factory';

describe('LRU cache module test suite', () => {
	describe('LRU cache options', () => {
		let app: NestApplication;
		const max = 1000;
		const ttl = 5000;

		beforeAll(async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [OptionsFactoryModule, LruCacheModule.register({ max, ttl })]
			}).compile();

			app = TestingModule.createNestApplication();

			await app.init();
			await app.listen(3000);
		});

		afterAll(async () => {
			await app.close();
		});

		test('LRU cache options should be defined', async () => {
			const lruCacheOptions = app.get<LruCacheOptions>(LRU_CACHE_OPTIONS);
			expect(lruCacheOptions).toBeDefined();
			// @ts-ignore ...
			expect(lruCacheOptions.max).toBe(max);
			// @ts-ignore ...
			expect(lruCacheOptions.ttl).toBe(ttl);
		});

		test('LRU cache instance should be defined', async () => {
			const lruCache = app.get<LRUCache<unknown, unknown>>(LRU_CACHE);
			expect(lruCache).toBeInstanceOf(LRUCache);
		});

		test('LRU cache service should be defined', async () => {
			const lruCacheProvider = app.get(LruCache);
			expect(lruCacheProvider).toBeInstanceOf(LruCache);
		});
	});

	describe('LRU cache async options', () => {
		const max = 10000;
		const ttl = 50000;

		const testModule = async (app: INestApplication): Promise<void> => {
			await app.init();
			await app.listen(3000);

			const lruCacheOptions = app.get<LruCacheOptions>(LRU_CACHE_OPTIONS);
			expect(lruCacheOptions).toBeDefined();
			// @ts-ignore ...
			expect(lruCacheOptions.max).toBe(max);
			// @ts-ignore ...
			expect(lruCacheOptions.ttl).toBe(ttl);

			const lruCache = app.get<LRUCache<unknown, unknown>>(LRU_CACHE);
			expect(lruCache).toBeInstanceOf(LRUCache);

			const lruCacheProvider = app.get(LruCache);
			expect(lruCacheProvider).toBeInstanceOf(LruCache);

			await app.close();
		};

		test('LRU cache options should be resolved with "useFactory"', async () => {
			const createOptions = async (): Promise<LruCacheOptions> => {
				return { max, ttl };
			};

			const TestingModule = await Test.createTestingModule({
				imports: [LruCacheModule.registerAsync({ useFactory: createOptions })]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});

		test('LRU cache imports should be injected to "useFactory"', async () => {
			const createOptions = async (factory: OptionsFactory): Promise<LruCacheOptions> => {
				expect(factory).toBeInstanceOf(OptionsFactory);
				return { max, ttl };
			};

			const TestingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.registerAsync({
						imports: [OptionsFactoryModule],
						inject: [OptionsFactory],
						useFactory: createOptions
					})
				]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});

		test('LRU cache options should be resolved with "useExisting"', async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.registerAsync({
						imports: [OptionsFactoryModule],
						useExisting: OptionsFactory
					})
				]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});

		test('LRU cache options should be resolved with "useClass"', async () => {
			const TestingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.registerAsync({
						imports: [OptionsFactoryModule],
						useClass: OptionsFactory
					})
				]
			}).compile();
			const app = TestingModule.createNestApplication();
			await testModule(app);
		});
	});
});
