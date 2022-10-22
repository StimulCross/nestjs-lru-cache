import { Inject, Injectable } from '@nestjs/common';
import type {
	Disposer,
	Entry,
	Fetcher,
	FetchOptions,
	GetOptions,
	HasOptions,
	PeekOptions,
	SetOptions,
	SizeCalculator
} from 'lru-cache';
import * as LRUCache from 'lru-cache';
import { LRU_CACHE } from '../lru-cache.constants';

/**
 * LRU cache service.
 *
 * Allows you to specify <K, V> (key, value) type parameters.
 */
@Injectable()
export class LruCache<K = any, V = any> {
	constructor(@Inject(LRU_CACHE) private readonly _cache: LRUCache<K, V>) {}

	/**
	 * The maximum number of entries that remain in the cache (assuming no TTL pruning or explicit deletions).
	 */
	public get max(): number {
		return this._cache.max;
	}

	/**
	 * Maximum size of all entries added to the cache.
	 */
	public get maxSize(): number {
		return this._cache.maxSize;
	}

	/**
	 * Maximum size of an entry added to the cache.
	 */
	public get maxEntrySize(): number {
		return this._cache.maxEntrySize;
	}

	/**
	 * Function used to calculate the size of stored entries.
	 */
	public get sizeCalculation(): SizeCalculator<K, V> | undefined {
		return this._cache.sizeCalculation;
	}

	/**
	 * Function that is called on items when they are dropped from the cache, as `this.dispose(value, key, reason)`.
	 */
	public get dispose(): Disposer<K, V> {
		return this._cache.dispose;
	}

	/**
	 * The same as dispose, but called after the entry is completely removed and the cache is once again in a clean
	 * state.
	 */
	public get disposeAfter(): Disposer<K, V> | null {
		return this._cache.disposeAfter;
	}

	/**
	 * Suppresses calling the `dispose()` function if the entry key is still accessible within the cache.
	 */
	public get noDisposeOnSet(): boolean {
		return this._cache.noDisposeOnSet;
	}

	/**
	 * Max time to live for items before they are considered stale.
	 */
	public get ttl(): number {
		return this._cache.ttl;
	}

	/**
	 * Minimum amount of time in ms in which to check for staleness.
	 */
	public get ttlResolution(): number {
		return this._cache.ttlResolution;
	}

	/**
	 * Whether to preemptively remove stale items from the cache.
	 */
	public get ttlAutopurge(): boolean {
		return this._cache.ttlAutopurge;
	}

	/**
	 * Whether to return the stale value on `get()` as well as deleting it.
	 */
	public get allowStale(): boolean {
		return this._cache.allowStale;
	}

	/**
	 * Whether to make each item's age reset to `0` whenever it is retrieved from cache with `get()`, causing it to not
	 * expire.
	 */
	public get updateAgeOnGet(): boolean {
		return this._cache.updateAgeOnGet;
	}

	/**
	 * Whether to make stale items to remain in the cache, until they are explicitly deleted with `delete()`.
	 */
	public get noDeleteOnStaleGet(): boolean {
		return this._cache.noDeleteOnStaleGet;
	}

	/**
	 * Function that is used to make background asynchronous fetches.
	 *
	 * Called with `fetchMethod(key, staleValue, { signal, options, context })`.
	 */
	public get fetchMethod(): Fetcher<K, V> | null {
		return this._cache.fetchMethod;
	}

	/**
	 * The total number of items held in the cache at the current moment.
	 */
	public get size(): number {
		return this._cache.size;
	}

	/**
	 * The total size of items in cache when using size tracking.
	 */
	public get calculatedSize(): number {
		return this._cache.calculatedSize;
	}

	/**
	 * Checks if a key is in the cache. Will return `false` if the item is stale, even though it is technically in
	 * the cache.
	 *
	 * Will not update item age unless `updateAgeOnHas` is set in the options or constructor.
	 *
	 * @param key The key to check.
	 * @param options Addition options.
	 */
	public has(key: K, options?: HasOptions): boolean {
		return this._cache.has(key, options);
	}

	/**
	 * Returns a value from the cache.
	 *
	 * If the key is not found, `get()` will return `undefined`.
	 * This can be confusing when setting values specifically to `undefined`, as in `set(key, undefined)`. Use `has()`
	 * to determine whether a key is present in the cache at all.
	 */
	public get<T = unknown>(key: K, options?: GetOptions): T | undefined {
		return this._cache.get<T>(key, options);
	}

	/**
	 * Like `get()` but doesn't update recency or delete stale items.
	 *
	 * Returns `undefined` if the item is stale, unless `allowStale` is set either on the cache or in the options object.
	 */
	public peek<T = unknown>(key: K, options?: PeekOptions): T | undefined {
		return this._cache.peek<T>(key, options);
	}

	/**
	 * Adds a value to the cache.
	 *
	 * The third parameter can be either a TTL number, or options object.
	 */
	public set(key: K, value: V, ttl?: number): this;
	public set(key: K, value: V, options?: SetOptions<K, V>): this;
	public set(key: K, value: V, optionsOrTtl?: SetOptions<K, V> | number): this {
		optionsOrTtl = typeof optionsOrTtl === 'number' ? { ttl: optionsOrTtl } : optionsOrTtl;
		this._cache.set(key, value, optionsOrTtl);
		return this;
	}

	/**
	 * Deletes a key out of the cache.
	 *
	 * Returns `true` if the key was deleted, `false` otherwise.
	 */
	public delete(key: K): boolean {
		return this._cache.delete(key);
	}

	/**
	 * Clears the cache entirely, throwing away all values.
	 */
	public clear(): void {
		return this._cache.clear();
	}

	/**
	 * Delete any stale entries.
	 *
	 * Returns `true` if anything was removed, `false` otherwise.
	 */
	public purgeStale(): boolean {
		return this._cache.purgeStale();
	}

	/**
	 * Find a value for which the supplied callback function returns a truthy value, similar to `Array.find()`.
	 *
	 * The function is called as `fn(value, key, cache)`.
	 */
	public find<T = V>(
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		callbackFn: (value: V, key: K, cache: LRUCache<K, V>) => void | boolean | undefined,
		options?: GetOptions
	): T {
		return this._cache.find(callbackFn, options);
	}

	/**
	 * Call the supplied function on each item in the cache, in order from most recently used to least recently used.
	 *
	 * The function is called as `fn(value, key, cache)`.  Does not update age or recenty of use.
	 */
	public forEach<T = this>(
		callbackFn: (this: T, value: V, key: K, cache: LRUCache<K, V>) => void,
		thisArg?: T
	): void {
		return this._cache.forEach(callbackFn, thisArg);
	}

	/**
	 * The same as `cache.forEach(...)` but items are iterated over in reverse order.
	 * (ie, less recently used items are iterated over first.)
	 */
	public rforEach<T = this>(
		callbackFn: (this: T, value: V, key: K, cache: LRUCache<K, V>) => void,
		thisArg?: T
	): void {
		return this._cache.rforEach(callbackFn, thisArg);
	}

	/**
	 * Returns the remaining time before an item expires.
	 *
	 * Returns `0` if the item is not found in the cache or is already expired.
	 */
	public getRemainingTTL(key: K): number {
		return this._cache.getRemainingTTL(key);
	}

	/**
	 * Return a generator yielding the keys in the cache, in order from most recently used to least recently used.
	 */
	public *keys(): Generator<K> {
		yield* this._cache.keys();
	}

	/**
	 * Inverse order version of `cache.keys()`.
	 *
	 * Return a generator yielding the keys in the cache, in order from least recently used to most recently used.
	 */
	public *rkeys(): Generator<K> {
		yield* this._cache.rkeys();
	}

	/**
	 * Return a generator yielding the values in the cache, in order from most recently used to least recently used.
	 */
	public *values(): Generator<V> {
		yield* this._cache.values();
	}

	/**
	 * Inverse order version of `cache.values()`.
	 *
	 * Return a generator yielding the values in the cache, in order from least recently used to most recently used.
	 */
	public *rvalues(): Generator<V> {
		yield* this._cache.rvalues();
	}

	/**
	 * Return a generator yielding `[key, value]` pairs, in order from most recently used to least recently used.
	 */
	public *entries(): Generator<[K, V]> {
		yield* this._cache.entries();
	}

	/**
	 * Inverse order version of `cache.entries()`.
	 *
	 * Return a generator yielding `[key, value]` pairs, in order from least recently used to most recently used.
	 */
	public *rentries(): Generator<[K, V]> {
		yield* this._cache.rentries();
	}

	/**
	 * Return an array of `[key, entry]` objects which can be passed to `cache.load()`.
	 */
	public dump(): Array<[K, Entry<V>]> {
		return this._cache.dump();
	}

	/**
	 * Reset the cache and load in the items in entries in the order listed.
	 *
	 * Note that the shape of the resulting cache may be different if the same options are not used in both caches.
	 */
	public load(cacheEntries: ReadonlyArray<[K, Entry<V>]>): void {
		return this._cache.load(cacheEntries);
	}

	/**
	 * Evicts the least recently used item, returning its value or `undefined` if cache is empty.
	 */
	public pop(): V | undefined {
		return this._cache.pop();
	}

	public async fetch<ExpectedValue = V>(key: K, options?: FetchOptions<K, V>): Promise<ExpectedValue | undefined> {
		return await this._cache.fetch(key, options);
	}

	/**
	 * Iterating over the cache itself yields the same results as `cache.entries()`.
	 */
	[Symbol.iterator](): Iterator<[K, V]> {
		return this.entries();
	}
}
