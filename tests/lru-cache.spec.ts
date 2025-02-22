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

		test('should match the specified module registration options with the cache provider options', async () => {
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

		test('should return the correct cache size', async () => {
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

		test('should correctly check if the cache has an entry', async () => {
			const cacheKey = 1;
			const fakeCacheKey = 2;
			cache.set(cacheKey, true);

			expect(cache.has(cacheKey)).toBe(true);
			expect(cache.has(fakeCacheKey)).toBe(false);
		});

		test('should retrieve an existing entry from the cache', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};
			cache.set(cacheEntry.key, cacheEntry.val);

			expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		});

		test('should return undefined for non-existing entries', async () => {
			expect(cache.get(1)).toBe(undefined);
		});

		test('should peek an existing cache entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};
			cache.set(cacheEntry.key, cacheEntry.val);

			expect(cache.peek(cacheEntry.key)).toBe(cacheEntry.val);
		});

		test('should return undefined when peeking non-existing entry', async () => {
			expect(cache.peek(1)).toBe(undefined);
		});

		test('should set an entry in the cache', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};
			cache.set(cacheEntry.key, cacheEntry.val);

			expect(cache.get(cacheEntry.key)).toBe(cacheEntry.val);
		});

		test('should set an entry with a TTL', async () => {
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

		test('should delete an entry from the cache', async () => {
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

		test('should clear all cache entries', async () => {
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

		test('should return an iterator for keys', async () => {
			const iterator = cache.keys();
			expect(typeof iterator[Symbol.iterator]).toBe('function');
			const iterator2 = cache.rkeys();
			expect(typeof iterator2[Symbol.iterator]).toBe('function');
		});

		test('should return an iterator for values', async () => {
			const iterator = cache.values();
			expect(typeof iterator[Symbol.iterator]).toBe('function');
			const iterator2 = cache.rvalues();
			expect(typeof iterator2[Symbol.iterator]).toBe('function');
		});

		test('should return an iterator for entries', async () => {
			const iterator = cache.entries();
			expect(typeof iterator[Symbol.iterator]).toBe('function');
			const iterator2 = cache.rentries();
			expect(typeof iterator2[Symbol.iterator]).toBe('function');
		});

		test('should iterate over keys in insertion order', async () => {
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

			const iterator = cache.keys();

			const key1 = iterator.next();
			expect(key1.value).toBe(cacheEntry2.key);

			const val2 = iterator.next();
			expect(val2.value).toBe(cacheEntry1.key);
		});

		test('should iterate over keys in reverse order', async () => {
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

			const iterator = cache.rkeys();

			const key1 = iterator.next();
			expect(key1.value).toBe(cacheEntry1.key);

			const val2 = iterator.next();
			expect(val2.value).toBe(cacheEntry2.key);
		});

		test('should iterate over values in insertion order', async () => {
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

			const iterator = cache.values();

			const key1 = iterator.next();
			expect(key1.value).toBe(cacheEntry2.val);

			const val2 = iterator.next();
			expect(val2.value).toBe(cacheEntry1.val);
		});

		test('should iterate over values in reverse order', async () => {
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

			const iterator = cache.rvalues();

			const key1 = iterator.next();
			expect(key1.value).toBe(cacheEntry1.val);

			const val2 = iterator.next();
			expect(val2.value).toBe(cacheEntry2.val);
		});

		test('should iterate over entries in insertion order', async () => {
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

			const iterrator = cache.entries();

			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
			const entry1 = iterrator.next();
			expect(Array.isArray(entry1.value)).toBe(true);
			expect(entry1.value[0]).toBe(cacheEntry2.key);
			expect(entry1.value[1]).toBe(cacheEntry2.val);

			const entry2 = iterrator.next();
			expect(Array.isArray(entry2.value)).toBe(true);
			expect(entry2.value[0]).toBe(cacheEntry1.key);
			expect(entry2.value[1]).toBe(cacheEntry1.val);
			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		});

		test('should iterate over entries in reverse order', async () => {
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

			const iterator = cache.rentries();

			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
			const entry1 = iterator.next();
			expect(Array.isArray(entry1.value)).toBe(true);
			expect(entry1.value[0]).toBe(cacheEntry1.key);
			expect(entry1.value[1]).toBe(cacheEntry1.val);

			const entry2 = iterator.next();
			expect(Array.isArray(entry2.value)).toBe(true);
			expect(entry2.value[0]).toBe(cacheEntry2.key);
			expect(entry2.value[1]).toBe(cacheEntry2.val);
			/* eslint-disable @typescript-eslint/no-unsafe-member-access */
		});

		test('should iterate over the cache provider using the default iterator', async () => {
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

		test('should iterate over cache entries using forEach', async () => {
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

		test('should iterate in reverse order using rforEach', async () => {
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

		test('should evict and return the least recently used entry using pop', async () => {
			const entries = 5;

			for (let i = 1; i <= entries; i++) {
				cache.set(i, i);
			}

			expect(cache.pop()).toBe(1);
		});

		test('should fetch an entry from the cache', async () => {
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

		test('should find an entry based on a predicate', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
			};

			cache.set(cacheEntry.key, cacheEntry.val);

			const result = cache.find((value, key) => key === cacheEntry.key);

			expect(result).toBe(cacheEntry.val);
		});

		test('should dump the cache into an array of entries', async () => {
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

		test('should load cache entries from a dumped array', async () => {
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

		test('should evict the least recently accessed entries when the "max" limit is reached', async () => {
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

		test("should reset an entry's TTL on check when updateAgeOnHas is enabled", async () => {
			const cacheKey = 1;
			cache.set(cacheKey, true, { ttl: 100 });

			await sleep(50);

			expect(cache.has(cacheKey, { updateAgeOnHas: true })).toBe(true);
			expect(cache.getRemainingTTL(cacheKey)).toBeGreaterThan(90);
		});

		test('should return undefined for an expired entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 10,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			await sleep(cacheEntry.ttl + 1);

			expect(cache.get(cacheEntry.key)).toBe(undefined);
		});

		test('should return the expired entry when allowStale is specified', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: 50,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			await sleep(50);

			expect(cache.get(cacheEntry.key, { allowStale: true })).toBe(cacheEntry.val);
		});

		test('should reset TTL on retrieval when updateAgeOnGet is specified', async () => {
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

		test('should purge stale entries from the cache', async () => {
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

		test('should return the remaining TTL for an existing entry', async () => {
			const cacheEntry = {
				key: 1,
				val: 1,
				ttl: Infinity,
			};
			cache.set(cacheEntry.key, cacheEntry.val, { ttl: cacheEntry.ttl });

			expect(cache.getRemainingTTL(cacheEntry.key)).toBe(Infinity);
		});

		test('should return 0 for the remaining TTL of a non-existing entry', async () => {
			expect(cache.getRemainingTTL(1)).toBe(0);
		});

		test('should return a negative TTL value for an expired entry', async () => {
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

		test('should evict the least recently accessed entries when the "maxSize" limit is reached', async () => {
			const entrySize = 50;

			for (let i = 1; i <= max; i++) {
				cache.set(i, i, { size: entrySize });
			}

			expect(cache.size).toBe(maxSize / entrySize);
			expect(cache.calculatedSize).toBe(maxSize);
		});

		test('should not set an entry if its size exceeds "maxEntrySize""', async () => {
			cache.set(1, 1, { size: 200 });
			expect(cache.size).toBe(0);
			expect(cache.calculatedSize).toBe(0);
		});

		test('should use the sizeCalculation function from module options', async () => {
			const entrySize = 50;

			for (let i = 1; i <= max; i++) {
				cache.set(i, fiftyBytesObject);
			}

			expect(cache.size).toBe(maxSize / entrySize);
			expect(cache.calculatedSize).toBe(maxSize);
		});

		test('should use the sizeCalculation function provided in set options', async () => {
			const entrySize = 100;

			for (let i = 1; i <= max; i++) {
				cache.set(i, fiftyBytesObject, { sizeCalculation: () => entrySize });
			}

			expect(cache.size).toBe(maxSize / entrySize);
			expect(cache.calculatedSize).toBe(maxSize);
		});
	});
});
