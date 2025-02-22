import { type INestApplication, Injectable } from '@nestjs/common';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { LRUCache } from 'lru-cache';
import { InjectCache, LRU_CACHE, LruCacheModule, type LruCacheOptions } from '../src';
import { LRU_CACHE_OPTIONS } from '../src/constants';
import { OptionsFactory } from './test-app/options-factory/options-factory';
import { OptionsFactoryModule } from './test-app/options-factory/options-factory.module';

@Injectable()
class CacheConsumer {
	constructor(@InjectCache() private readonly cache: LRUCache<{}, {}>) {}

	getCache(): LRUCache<{}, {}> {
		return this.cache;
	}
}

const testCacheOptions = (options: LruCacheOptions, max?: number, ttl?: number): void => {
	expect(options).toBeDefined();
	expect(options.max).toBe(max);
	expect(options.ttl).toBe(ttl);
};

const testCacheInstance = (ttlCache: LRUCache<any, any>): void => {
	expect(ttlCache).toBeDefined();
	expect(ttlCache).toBeInstanceOf(LRUCache);
};

describe('LRU cache module test suite', () => {
	describe('LRU cache options', () => {
		let app: NestApplication;
		const max = 1000;
		const ttl = 5000;

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [OptionsFactoryModule, LruCacheModule.register({ max, ttl })],
			}).compile();

			app = testingModule.createNestApplication();

			await app.init();
		});

		test('should define LRU cache options', async () => {
			testCacheOptions(app.get<LruCacheOptions>(LRU_CACHE_OPTIONS), max, ttl);
		});

		test('should define LRU cache instance', async () => {
			testCacheInstance(app.get<LRUCache<any, any>>(LRU_CACHE));
		});
	});

	describe('LRU cache async options', () => {
		const max = 10_000;
		const ttl = 50_000;

		const testModule = async (app: INestApplication): Promise<void> => {
			await app.init();
			testCacheOptions(app.get<LruCacheOptions>(LRU_CACHE_OPTIONS), max, ttl);
			testCacheInstance(app.get<LRUCache<any, any>>(LRU_CACHE));
		};

		test('should resolve LRU cache options with "useFactory"', async () => {
			const createOptions = async (): Promise<LruCacheOptions> => ({ max, ttl });

			const testingModule = await Test.createTestingModule({
				imports: [LruCacheModule.registerAsync({ useFactory: createOptions })],
			}).compile();
			const app = testingModule.createNestApplication();
			await testModule(app);
		});

		test('should inject LRU cache imports to "useFactory"', async () => {
			const createOptions = async (factory: OptionsFactory): Promise<LruCacheOptions> => {
				expect(factory).toBeInstanceOf(OptionsFactory);
				return { max, ttl };
			};

			const testingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.registerAsync({
						imports: [OptionsFactoryModule],
						inject: [OptionsFactory],
						useFactory: createOptions,
					}),
				],
			}).compile();
			const app = testingModule.createNestApplication();
			await testModule(app);
		});

		test('should resolve LRU cache options with "useExisting"', async () => {
			const testingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.registerAsync({
						imports: [OptionsFactoryModule],
						useExisting: OptionsFactory,
					}),
				],
			}).compile();
			const app = testingModule.createNestApplication();
			await testModule(app);
		});

		test('should resolve LRU cache options with "useClass"', async () => {
			const testingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.registerAsync({
						imports: [OptionsFactoryModule],
						useClass: OptionsFactory,
					}),
				],
			}).compile();
			const app = testingModule.createNestApplication();
			await testModule(app);
		});
	});

	describe('LRU cache instance', () => {
		let app: NestApplication;

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [LruCacheModule.register({ max: 10 })],
				providers: [CacheConsumer],
			}).compile();

			app = testingModule.createNestApplication();

			await app.init();
		});

		test('should inject the LRUCache instance using the @InjectCache decorator', () => {
			const cacheConsumer = app.get(CacheConsumer);
			testCacheInstance(cacheConsumer.getCache());
		});
	});
});
