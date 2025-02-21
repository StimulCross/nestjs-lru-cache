import { setTimeout as sleep } from 'node:timers/promises';
import { type NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { LRUCache } from 'lru-cache';
import { sizeof } from 'sizeof';
import { LRU_CACHE, LruCacheModule } from '../src';

describe('LRU cache provider test suite', () => {
	describe('LRU cache options', () => {
		let app: NestApplication;
		let cache: LRUCache<{}, {}>;
		const max = 20;
		const ttl = 5000;
		const maxSize = 400;
		const maxEntrySize = 100;
		const sizeCalculation = (val: object): number => sizeof(val);
		const dispose: LRUCache.Disposer<{}, {}> = (value, key, reason) => {
			console.log(value, key, reason);
		};
		const disposeAfter: LRUCache.Disposer<{}, {}> = (value, key, reason) => {
			console.log(value, key, reason);
		};
		const ttlResolution = 10;
		/* eslint-disable @typescript-eslint/naming-convention */
		const allowStale = true;
		const ttlAutopurge = true;
		const noUpdateTTL = true;
		const fetchMethod: LRUCache.Fetcher<{}, {}> = (key, staleValue, options) => {
			console.log(key, staleValue, options);
		};
		const noDeleteOnFetchRejection = true;
		const noDeleteOnStaleGet = true;
		const noDisposeOnSet = true;
		const updateAgeOnGet = true;
		const updateAgeOnHas = true;
		/* eslint-enable @typescript-eslint/naming-convention */

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.register({
						max,
						ttl,
						maxSize,
						maxEntrySize,
						sizeCalculation,
						ttlResolution,
						dispose,
						allowStale,
						updateAgeOnGet,
						disposeAfter,
						fetchMethod,
						noDeleteOnStaleGet,
						noDisposeOnSet,
						ttlAutopurge,
						updateAgeOnHas,
						noUpdateTTL,
						noDeleteOnFetchRejection,
					}),
				],
			}).compile();

			app = testingModule.createNestApplication();
			cache = app.get<LRUCache<{}, {}>>(LRU_CACHE);

			await app.init();
		});

		afterEach(() => {
			cache.clear();
		});

		test('Specified options on module registration must match options in cache provider', async () => {
			expect(cache.max).toBe(max);
			expect(cache.ttl).toBe(ttl);
			expect(cache.maxSize).toBe(maxSize);
			expect(cache.maxEntrySize).toBe(maxEntrySize);
			expect(cache.sizeCalculation).toBe(sizeCalculation);
			expect(cache.ttlResolution).toBe(ttlResolution);
			expect(cache.dispose).toBe(dispose);
			expect(cache.allowStale).toBe(allowStale);
			expect(cache.updateAgeOnGet).toBe(updateAgeOnGet);
			expect(cache.disposeAfter).toBe(disposeAfter);
			expect(cache.fetchMethod).toBe(fetchMethod);
			expect(cache.noDeleteOnStaleGet).toBe(noDeleteOnStaleGet);
			expect(cache.noDisposeOnSet).toBe(noDisposeOnSet);
			expect(cache.ttlAutopurge).toBe(ttlAutopurge);
			expect(cache.updateAgeOnGet).toBe(updateAgeOnGet);
		});
	});

	describe('LRU cache general functionality', () => {
		let app: NestApplication;
		let cache: LRUCache<{}, {}>;
		const max = 20;
		const ttl = 5000;

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [LruCacheModule.register({ max, ttl })],
			}).compile();

			app = testingModule.createNestApplication();
			cache = app.get<LRUCache<{}, {}>>(LRU_CACHE);

			await app.init();
		});

		afterEach(() => {
			cache.clear();
		});

		test('Should return the correct cache size', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
				ttl: Infinity,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
				ttl: Infinity,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry2.ttl });
			expect(cache.size).toBe(1);

			cache.set(cacheEntry2.key, cacheEntry2.val, { ttl: cacheEntry2.ttl });
			expect(cache.size).toBe(2);
		});

		test('Should check if the cache has an entry', async () => {
			const cacheKey = 1;
			const fakeCacheKey = 2;
			cache.set(cacheKey, true);

			expect(cache.has(cacheKey)).toBe(true);
			expect(cache.has(fakeCacheKey)).toBe(false);
		});

		test('Should get existing entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};
			cache.set(cacheEntry.key, cacheEntry.val);

			expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		});

		test('Should return "undefined" if get non-existing entry', async () => {
			expect(cache.get(1)).toBe(undefined);
		});

		test('Should peek existing entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};
			cache.set(cacheEntry.key, cacheEntry.val);

			expect(cache.peek(cacheEntry.key)).toBe(cacheEntry.val);
		});

		test('Should return "undefined" if peek non-existing entry', async () => {
			expect(cache.peek(1)).toBe(undefined);
		});

		test('Should set entry to the cache', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};
			cache.set(cacheEntry.key, cacheEntry.val);

			expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		});

		test('Should set entry to the cache with ttl overload', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 100,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
			expect(cache.getRemainingTTL(cacheEntry.key)).toBeGreaterThan(90);
		});

		test('Should set entry to the cache with options overload', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				options: {
					ttl: Infinity,
				},
			};
			cache.set(cacheEntry.key, cacheEntry.val, cacheEntry.options);

			expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
			expect(cache.getRemainingTTL(cacheEntry.key)).toBe(cacheEntry.options.ttl);
		});

		test('Should delete an entry from the cache', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
				ttl: Infinity,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
				ttl: 100,
			};
			cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });
			cache.set(cacheEntry2.key, cacheEntry2.val, { ttl: cacheEntry2.ttl });

			expect(cache.delete(cacheEntry1.key)).toBe(true);
			expect(cache.delete(cacheEntry2.key)).toBe(true);
		});

		test('Should clear the cache', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
				ttl: 20,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
				ttl: 20,
			};
			cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });
			cache.set(cacheEntry2.key, cacheEntry2.val, { ttl: cacheEntry2.ttl });

			cache.clear();

			expect(cache.size).toBe(0);
		});

		test('Should return keys Generator', async () => {
			const generator = cache.keys();
			expect(typeof generator[Symbol.iterator]).toBe('function');
			const generator2 = cache.rkeys();
			expect(typeof generator2[Symbol.iterator]).toBe('function');
		});

		test('Should return values Generator', async () => {
			const generator = cache.values();
			expect(typeof generator[Symbol.iterator]).toBe('function');
			const generator2 = cache.rvalues();
			expect(typeof generator2[Symbol.iterator]).toBe('function');
		});

		test('Should return entries Generator', async () => {
			const generator = cache.entries();
			expect(typeof generator[Symbol.iterator]).toBe('function');
			const generator2 = cache.rentries();
			expect(typeof generator2[Symbol.iterator]).toBe('function');
		});

		test('Should iterate over keys', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			const generator = cache.keys();

			const key1 = generator.next();
			expect(key1.value).toBe(cacheEntry2.key);

			const val2 = generator.next();
			expect(val2.value).toBe(cacheEntry1.key);
		});

		test('Should iterate over keys in reverse order', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			const generator = cache.rkeys();

			const key1 = generator.next();
			expect(key1.value).toBe(cacheEntry1.key);

			const val2 = generator.next();
			expect(val2.value).toBe(cacheEntry2.key);
		});

		test('Should iterate over values', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			const generator = cache.values();

			const key1 = generator.next();
			expect(key1.value).toBe(cacheEntry2.val);

			const val2 = generator.next();
			expect(val2.value).toBe(cacheEntry1.val);
		});

		test('Should iterate over values in reverse order', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			const generator = cache.rvalues();

			const key1 = generator.next();
			expect(key1.value).toBe(cacheEntry1.val);

			const val2 = generator.next();
			expect(val2.value).toBe(cacheEntry2.val);
		});

		test('Should iterate over entries', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			const generator = cache.entries();

			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
			const entry1 = generator.next();
			expect(Array.isArray(entry1.value)).toBe(true);
			expect(entry1.value[0]).toBe(cacheEntry2.key);
			expect(entry1.value[1]).toBe(cacheEntry2.val);

			const entry2 = generator.next();
			expect(Array.isArray(entry2.value)).toBe(true);
			expect(entry2.value[0]).toBe(cacheEntry1.key);
			expect(entry2.value[1]).toBe(cacheEntry1.val);
			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		});

		test('Should iterate over entries in reverse order', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			const generator = cache.rentries();

			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
			const entry1 = generator.next();
			expect(Array.isArray(entry1.value)).toBe(true);
			expect(entry1.value[0]).toBe(cacheEntry1.key);
			expect(entry1.value[1]).toBe(cacheEntry1.val);

			const entry2 = generator.next();
			expect(Array.isArray(entry2.value)).toBe(true);
			expect(entry2.value[0]).toBe(cacheEntry2.key);
			expect(entry2.value[1]).toBe(cacheEntry2.val);
			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		});

		test('Should iterate over cache provider itself', async () => {
			expect(typeof cache[Symbol.iterator]).toBe('function');

			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			let count = 5;

			for (const [key, val] of cache) {
				expect(key).toBe(count);
				expect(val).toBe(count);
				count--;
			}
		});

		test('Should iterate using `forEach`', async () => {
			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			let count = 5;

			cache.forEach((value, key, cacheInstance) => {
				expect(key).toBe(count);
				expect(value).toBe(count);
				expect(cacheInstance).toBeInstanceOf(LRUCache);
				count--;
			});
		});

		test('Should iterate using `forEach` in reverse order', async () => {
			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			let count = 1;

			cache.rforEach((value, key, cacheInstance) => {
				expect(key).toBe(count);
				expect(value).toBe(count);
				expect(cacheInstance).toBeInstanceOf(LRUCache);
				count++;
			});
		});

		test('Should evict and return the least recently used entry', async () => {
			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			expect(cache.pop()).toBe(1);
		});

		test('Should fetch an entry', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
			};

			cache.set(cacheEntry1.key, cacheEntry1.val);
			cache.set(cacheEntry2.key, cacheEntry2.val);

			expect(await cache.fetch(cacheEntry1.key)).toBe(cacheEntry1.val);
			expect(await cache.fetch(cacheEntry2.key)).toBe(cacheEntry2.val);
		});

		test('Should find an entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};

			cache.set(cacheEntry.key, cacheEntry.val);

			const result = cache.find((value, key) => key === cacheEntry.key);

			expect(result).toBe(cacheEntry.val);
		});

		test('Should dump the cache', async () => {
			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			const dump = cache.dump();

			expect(dump).toBeInstanceOf(Array);

			let count = 1;

			for (const [key, val] of dump) {
				expect(key).toBe(count);
				expect(val.value).toBe(count);
				count++;
			}
		});

		test('Should load the cache', async () => {
			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			const dump = cache.dump();

			cache.load(dump);

			expect(dump).toBeInstanceOf(Array);

			let count = 5;

			for (const [key, val] of cache) {
				expect(key).toBe(count);
				expect(val).toBe(count);
				count--;
			}
		});
	});

	describe('LRU cache capacity tracking functionality', () => {
		let app: NestApplication;
		let cache: LRUCache<{}, {}>;
		const max = 5;

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [LruCacheModule.register({ max })],
			}).compile();

			app = testingModule.createNestApplication();
			cache = app.get<LRUCache<{}, {}>>(LRU_CACHE);

			await app.init();
		});

		afterEach(() => {
			cache.clear();
		});

		test('Should evict the least recently accessed entries when "max" limit is reached', async () => {
			for (let i = 1; i <= max; i++) {
				cache.set(i, i);
			}

			expect(cache.size).toBe(max);

			const newEntryIndex = max + 1;
			cache.set(newEntryIndex, newEntryIndex);

			expect(cache.size).toBe(max);
			// 1 is evicted, 2 the least recently accessed entry now
			expect(cache.pop()).toBe(2);
		});
	});

	describe('LRU cache TTL tracking functionality', () => {
		let app: NestApplication;
		let cache: LRUCache<{}, {}>;
		const max = 10;
		const ttl = 2000;

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [LruCacheModule.register({ max, ttl })],
			}).compile();

			app = testingModule.createNestApplication();
			cache = app.get<LRUCache<{}, {}>>(LRU_CACHE);

			await app.init();
			await app.listen(3000);
		});

		afterAll(async () => {
			await app.close();
		});

		afterEach(() => {
			cache.clear();
		});

		test("Should reset entry's TTL on check", async () => {
			const cacheKey = 1;
			cache.set(cacheKey, true, { ttl: 100 });

			await sleep(50);

			expect(cache.has(cacheKey, { updateAgeOnHas: true })).toBe(true);
			expect(cache.getRemainingTTL(cacheKey)).toBeGreaterThan(90);
		});

		test('Should return "undefined" when trying to get an expired entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 10,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			await sleep(cacheEntry.ttl + 1);

			expect(cache.get(cacheEntry.key)).toBe(undefined);
		});

		test('Should return expired entry if `allowStale` specified', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 50,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			await sleep(50);

			expect(cache.get(cacheEntry.key, { allowStale: true })).toBe(cacheEntry.val);
		});

		test('Should reset TTL on retrieving if `updateAgeOnGet` specified', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 50,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			await sleep(40);

			expect(cache.get(cacheEntry.key, { updateAgeOnGet: true })).toBe(cacheEntry.val);
			expect(cache.getRemainingTTL(cacheEntry.key)).toBeGreaterThan(cacheEntry.ttl - 10);
		});

		test('Should purge stale entries from the cache', async () => {
			const cacheEntry1 = {
				key: 1,
				val: 1,
				ttl: 20,
			};
			const cacheEntry2 = {
				key: 2,
				val: 2,
				ttl: 20,
			};
			const cacheEntry3 = {
				key: 3,
				val: 3,
				ttl: Infinity,
			};
			cache.set(cacheEntry1.key, cacheEntry1.val, { ttl: cacheEntry1.ttl });
			cache.set(cacheEntry2.key, cacheEntry2.val, { ttl: cacheEntry2.ttl });
			cache.set(cacheEntry3.key, cacheEntry3.val, { ttl: cacheEntry3.ttl });

			await sleep(cacheEntry1.ttl + 10);

			cache.purgeStale();

			expect(cache.size).toBe(1);
		});

		test('Should return remaining TTL of an existing entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: Infinity,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			expect(cache.getRemainingTTL(cacheEntry.key)).toBe(Infinity);
		});

		test('Should return 0 when getting remaining TTL of a non-existing entry', async () => {
			expect(cache.getRemainingTTL(1)).toBe(0);
		});

		test('Should return negative number when getting remaining TTL of an expired entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 10,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			await sleep(cacheEntry.ttl + 10);
			expect(cache.getRemainingTTL(cacheEntry.key)).toBeLessThanOrEqual(0);
		});
	});

	describe('LRU cache size tracking functionality', () => {
		let app: NestApplication;
		let cache: LRUCache<{}, {}>;
		const max = 20;
		const maxSize = 400;
		const maxEntrySize = 100;
		const sizeCalculationFn = (val: object): number => sizeof(val);
		const fiftyBytesObject = {
			str: 'abcdefghi',
			bool: true,
			int: 1000,
		};

		beforeAll(async () => {
			const testingModule = await Test.createTestingModule({
				imports: [
					LruCacheModule.register({
						max,
						maxEntrySize,
						maxSize,
						sizeCalculation: sizeCalculationFn,
					}),
				],
			}).compile();

			app = testingModule.createNestApplication();
			cache = app.get<LRUCache<{}, {}>>(LRU_CACHE);

			await app.init();
		});

		afterEach(() => {
			cache.clear();
		});

		test('Should evict the least recently accessed entries when "maxSize" limit is reached', async () => {
			const entrySize = 50;

			for (let i = 1; i <= max; i++) {
				cache.set(i, i, { size: entrySize });
			}

			expect(cache.size).toBe(maxSize / entrySize);
			expect(cache.calculatedSize).toBe(maxSize);
		});

		test('Should not set an entry if its size is larger than "maxEntrySize"', async () => {
			cache.set(1, 1, { size: 200 });
			expect(cache.size).toBe(0);
			expect(cache.calculatedSize).toBe(0);
		});

		test('Should use "sizeCalculation" function from module options', async () => {
			const entrySize = 50;

			for (let i = 1; i <= max; i++) {
				cache.set(i, fiftyBytesObject);
			}

			expect(cache.size).toBe(maxSize / entrySize);
			expect(cache.calculatedSize).toBe(maxSize);
		});

		test('Should use "sizeCalculation" function from set options', async () => {
			const entrySize = 100;

			for (let i = 1; i <= max; i++) {
				cache.set(i, fiftyBytesObject, { sizeCalculation: () => entrySize });
			}

			expect(cache.size).toBe(maxSize / entrySize);
			expect(cache.calculatedSize).toBe(maxSize);
		});
	});
});
