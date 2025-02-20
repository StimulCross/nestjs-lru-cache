import { type INestApplication } from '@nestjs/common';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { type LimitedByCount, type LimitedByTTL } from 'lru-cache';
import { LruCache, LruCacheModule, type LruCacheOptions } from '../src';
import { LRU_CACHE_OPTIONS } from '../src/constants';
import { OptionsFactory } from './test-app/options-factory/options-factory';
import { OptionsFactoryModule } from './test-app/options-factory/options-factory.module';

const testCacheOptions = (options: LruCacheOptions, max?: number, ttl?: number): void => {
	expect(options).toBeDefined();
	expect((options as LimitedByCount).max).toBe(max);
	expect((options as LimitedByTTL).ttl).toBe(ttl);
};

const testCacheProvider = (ttlCache: LruCache): void => {
	expect(ttlCache).toBeDefined();
	expect(ttlCache).toHaveProperty('get');
	expect(ttlCache).toHaveProperty('set');
	expect(ttlCache).toHaveProperty('has');
	expect(ttlCache).toHaveProperty('delete');
};

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
		});

		test('LRU cache options should be defined', async () => {
			testCacheOptions(app.get<LruCacheOptions>(LRU_CACHE_OPTIONS), max, ttl);
		});

		test('LRU cache should be defined', async () => {
			testCacheProvider(app.get(LruCache));
		});
	});

	describe('LRU cache async options', () => {
		const max = 10000;
		const ttl = 50000;

		const testModule = async (app: INestApplication): Promise<void> => {
			await app.init();
			testCacheOptions(app.get<LruCacheOptions>(LRU_CACHE_OPTIONS), max, ttl);
			testCacheProvider(app.get(LruCache));
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
