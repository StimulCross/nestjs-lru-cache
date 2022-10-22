# NestJS LRU Cache

> **WARNING:** Although this library has been automatically (100% covered) and manually tested, it may still have fundamental design issues. Use it at your own risk.

### Table of Contents

-   [Instalation](#installation)
-   [Introduction](#introduction)
-   [General Usage](#general-usage)
-   [Options](#options)
    -   [max](#max)
    -   [maxSize](#maxsize)
    -   [maxEntrySize](#maxentrysize)
    -   [sizeCalculation](#sizecalculation)
    -   [fetchMethod](#fetchmethod)
    -   [fetchContext](#fetchcontext)
    -   [noDeleteOnFetchRejection](#nodeleteonfetchrejection)
    -   [dispose](#dispose)
    -   [disposeAfter](#disposeafter)
    -   [noDisposeOnSet](#nodisposeonset)
    -   [ttl](#ttl)
    -   [noUpdateTTL](#noupdatettl)
    -   [ttlResolution](#ttlresolution)
    -   [ttlAutopurge](#ttlautopurge)
    -   [allowStale](#allowstale)
    -   [noDeleteOnStaleGet](#nodeleteonstaleget)
    -   [updateAgeOnGet](#updateageonget)
    -   [updateAgeOnHas](#updateageonhas)
-   [API](#api)
    -   [size](#size)
    -   [has](#haskey--allowstale-)
    -   [get](#getkey--allowstale-updateageonget-nodeleteonstaleget-)
    -   [peek](#peekkey--allowstale-)
    -   [set](#setkey-value-ttl)
    -   [delete](#deletekey)
    -   [clear](#clear)
    -   [keys](#keys)
    -   [rkeys](#rkeys)
    -   [values](#values)
    -   [rvalues](#rvalues)
    -   [entries](#entries)
    -   [rentries](#rentries)
    -   [find](#findfn--allowstale-updateageonget-nodeleteonstaleget-)
    -   [dump](#dump)
    -   [load](#loadentries)
    -   [purgeStale](#purgestale)
    -   [getRemainingTTL](#getremainingttlkey)
    -   [forEach](#foreachfn-thisp)
    -   [rforEach](#rforeachfn-thisp)
    -   [pop](#pop)
    -   [Symbol.iterator](#symboliterator)
-   [Decorators](#decorators)
    -   [@Cacheable](#cacheable)
    -   [@Cached](#cached)
        -   [@Cached Options](#cached-options)
    -   [@CachedAsync](#cachedasync)
        -   [@CachedAsync Options](#cachedasync-options)
    -   [Argument Options](#argument-options)

## Installation

Using **npm**:

```
npm i --save nestjs-lru-cache
```

Using **yarn**:

```
yarn add nestjs-lru-cache
```

## Introduction

This is a NestJS wrapper around popular [lru-cache](https://github.com/isaacs/node-lru-cache) library, one of the most performant LRU cache implementations available, with support for fancy **[cache decorators](#decorators)** ❤

This cache module focuses on the LRU caching strategy where the least used entries are removed from the cache.

Specify a max number of the most recently used items that you want to keep, and this cache will keep that many of the most recently accessed items.

Although this library supports TTL, it does not make strong TTL guarantees. There is no preemptive pruning of expired items by default, but you _may_ set a TTL on the cache or on a single set. If you do so, it will treat expired items as missing, and delete them when fetched. If you are more interested in TTL caching than LRU caching, consider using [nestjs-ttl-cache](https://github.com/stimulcross/nestjs-ttl-cache) - a NestJS wrapper for [@isaacs/ttlcache](https://github.com/isaacs/ttlcache) library.

## General Usage

First of all, you must register the module in your main **AppModule** using either `register` or `registerAsync` static methods.

`register` method allow you to directly set [cache options](#options):

```ts
import { Module } from '@nestjs/common';
import { LruCacheModule } from 'nestjs-lru-cache';

@Module({
	imports: [
		LruCacheModule.register({
			isGlobal: true,
			max: 10000
		})
	]
})
export class AppModule {}
```

`registerAsync` method allow you to use one of the following options factories: `useFactory`, `useClass`, or `useExisting`. If you need dynamically generate cache options, for example, using your `ConfigService`, you can do this using `useFactory` like this:

```ts
import { Module } from '@nestjs/common';
import { LruCacheModule, LruCacheOptions } from 'nestjs-lru-cache';

@Module({
	imports: [
		ConfigModule.register({
			isGlobal: true,
			cache: true
		}),
		LruCacheModule.registerAsync({
			isGlobal: true,
			inject: [ConfigService],
			useFactory: async (configService: ConfigService): Promise<LruCacheOptions> => {
				return {
					max: Number(configService.get('CACHE_MAX')),
					ttl: Number(configService.get('CACHE_TTL'))
				};
			}
		})
	]
})
export class AppModule {}
```

The `ConfigService` will be injected into the `useFactory` function. Note that in the example above, `ConfigModule` is global, so it does not need to be imported to the `LruCacheModule`.

Another option is to use class factories with `useClass` and `useExisting`. `useClass` creates a new instance of the given class, while `useExisting` uses the single shared instance. The provider must implement `LruCacheOptionsFactory` interface:

```ts
interface LruCacheOptionsFactory {
	createLruCacheOptions(): Promise<LruCacheOptions> | LruCacheOptions;
}
```

```ts
import { Injectable } from '@nestjs/common';
import { LruCacheOptionsFactory } from 'nestjs-lru-cache';

@Injectable()
export class OptionsFactory implements LruCacheOptionsFactory {
	createLruCacheOptions(): LruCacheOptions {
		return {
			max: 10000,
			ttl: 10000
		};
	}
}
```

The root module should look like this:

```ts
import { Module } from '@nestjs/common';
import { LruCacheModule } from 'nestjs-lru-cache';

@Module({
	imports: [
		// We are assuming this is a global module,
		// so we don't need to import it to the `LruCacheModule`
		OptionsFactoryModule,
		LruCacheModule.registerAsync({
			isGlobal: true,
			useExisting: OptionsFactory
		})
	]
})
export class AppModule {}
```

Once the module is registered, `LruCache` provider can be injected as a dependency. Note that `LruCacheModule` is registered as a global module, so it does not need to be imported into other modules.

```ts
import { Injectable } from '@nestjs/common';
import { LruCache } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(private readonly _cache: LruCache) {}
}
```

You can also inject the **original** cache instance provided by [lru-cache](https://github.com/isaacs/node-lru-cache) library using `LRU_CACHE` token:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { LRU_CACHE } from 'nestjs-lru-cache';
import * as LRUCache from 'lru-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(@Inject(LRU_CACHE) private readonly _cache: LRUCache) {}
}
```

See [API](#api) section below for the cache usage information.

## Options

```ts
import { Disposer, SizeCalculator, Fetcher } from 'lru-cache';

interface LruCacheOptions<K = any, V = any> {
	max?: number;
	maxSize?: number;
	ttl?: number;

	// At lest one of the three above is required.

	maxEntrySize?: number;
	sizeCalculation?: SizeCalculator<K, V>;
	dispose?: Disposer<K, V>;
	disposeAfter?: Disposer<K, V>;
	noDisposeOnSet?: boolean;
	fetchMethod?: Fetcher<K, V>;
	noDeleteOnFetchRejection?: boolean;
	fetchContext?: any;
	noUpdateTTL?: boolean;
	ttlResolution?: number;
	ttlAutopurge?: boolean;
	allowStale?: boolean;
	updateAgeOnGet?: boolean;
	noDeleteOnStaleGet?: boolean;
	updateAgeOnHas?: boolean;
}
```

Either `register` or `registerAsync` (its factories) should provide the following cache options:

> **NOTE:** At least one of `max`, `maxSize`, or `ttl` is required.

### `max`

The maximum number of items that remain in the cache (assuming no TTL pruning or explicit deletions). Note that fewer items may be stored if size calculation is used, and maxSize is exceeded. This must be a positive finite integer.

**It is strongly recommended to set `max` to prevent unbounded growth of the cache**. See [Storage Bounds Safety](https://github.com/isaacs/node-lru-cache/blob/main/README.md#storage-bounds-safety) notes from the original maintainer.

### `maxSize`

Set to a positive integer to track the sizes of items added to the cache, and automatically evict items in order to stay below this size. Note that this may result in fewer than max items being stored.

Attempting to add an item to the cache whose calculated size is greater that this amount will be a no-op. The item will not be cached, and no other items will be evicted.

Optional, must be a positive integer if provided.

Sets `maxEntrySize` to the same value, unless a different value is provided for `maxEntrySize`.

Even if size tracking is enabled, **it is strongly recommended to set `max` to prevent unbounded growth of the cache**. See [Storage Bounds Safety](https://github.com/isaacs/node-lru-cache/blob/main/README.md#storage-bounds-safety) notes from the original maintainer.

### `maxEntrySize`

Set to a positive integer to track the sizes of items added to the cache, and prevent caching any item over a given size. Attempting to add an item whose calculated size is greater than this amount will be a no-op. The item will not be cached, and no other items will be evicted.

Optional, must be a positive integer if provided. Defaults to the value of maxSize if provided.

### `sizeCalculation`

Function used to calculate the size of stored items. If you're storing strings or buffers, then you probably want to do something like `n => n.length`. The item is passed as the first argument, and the key is passed as the second argument.

This may be overridden by passing an options object to `set()`.

Requires `maxSize` to be set. If the resulting calculated size is greater than `maxSize`, then the item will not be added to the cache.

### `fetchMethod`

Function that is used to make background asynchronous fetches. Called with `fetchMethod(key, staleValue, { signal, options, context })`. May return a Promise.

If `fetchMethod` is not provided, then `fetch(key)` is equivalent to `Promise.resolve(cache.get(key))`.

The `signal` object is an `AbortSignal` if that's available in the global object, otherwise it's a pretty close polyfill.

If at any time, `signal.aborted` is set to `true`, or if the `signal.onabort` method is called, or if it emits an `'abort'` event which you can listen to with `addEventListener`, then that means that the fetch should be abandoned. This may be passed along to async functions aware of AbortController/AbortSignal behavior.

The `options` object is a union of the options that may be provided to `set()` and `get()`. If they are modified, then that will result in modifying the settings to `set()` when the value is resolved. For example, a DNS cache may update the TTL based on the value returned from a remote DNS server by changing `options.ttl` in the `fetchMethod`.

### `fetchContext`

Arbitrary data that can be passed to the `fetchMethod` as the `context` option.

Note that this will only be relevant when the `fetch()` call needs to call `fetchMethod()`. Thus, any data which will meaningfully vary the fetch response needs to be present in the key. This is primarily intended for including `x-request-id` headers and the like for debugging purposes, which do not affect the `fetchMethod()` response.

### `noDeleteOnFetchRejection`

If a `fetchMethod` throws an error or returns a rejected promise, then by default, any existing stale value will be removed from the cache.

If `noDeleteOnFetchRejection` is set to `true`, then this behavior is suppressed, and the stale value remains in the cache in the case of a rejected `fetchMethod`.

This is important in cases where a `fetchMethod` is only called as a background update while the stale value is returned, when `allowStale` is used.

This may be set in calls to `fetch()`, or defaulted on the constructor.

### `dispose`

Function that is called on items when they are dropped from the cache, as `dispose(value, key, reason)`.

This can be handy if you want to close file descriptors or do other cleanup tasks when items are no longer stored in the cache.

NOTE: It is called before the item has been fully removed from the cache, so if you want to put it right back in, you need to wait until the next tick. If you try to add it back in during the `dispose()` function call, it will break things in subtle and weird ways.

Unlike several other options, this may not be overridden by passing an option to `set()`, for performance reasons. If disposal functions may vary between cache entries, then the entire list must be scanned on every cache swap, even if no disposal function is in use.

The `reason` will be one of the following strings, corresponding to the reason for the item's deletion:

-   `evict` Item was evicted to make space for a new addition
-   `set` Item was overwritten by a new value
-   `delete` Item was removed by explicit `delete(key)` or by calling `clear()`, which deletes everything.

The `dispose()` method is _not_ called for canceled calls to `fetchMethod()`. If you wish to handle evictions, overwrites, and deletes of in-flight asynchronous fetches, you must use the `AbortSignal` provided.

Optional, must be a function.

### `disposeAfter`

The same as `dispose`, but called after the entry is completely removed and the cache is once again in a clean state.

It is safe to add an item right back into the cache at this point. However, note that it is very easy to inadvertently create infinite recursion in this way.

The `disposeAfter()` method is _not_ called for canceled calls to `fetchMethod()`. If you wish to handle evictions, overwrites, and deletes of in-flight asynchronous fetches, you must use the `AbortSignal` provided.

### `noDisposeOnSet`

Set to `true` to suppress calling the `dispose()` function if the entry key is still accessible within the cache.

This may be overridden by passing an options object to `set()`.

Boolean, default `false`. Only relevant if `dispose` or `disposeAfter` options are set.

### `ttl`

Max time to live for items before they are considered stale. Note that stale items are NOT preemptively removed by default, and MAY live in the cache, contributing to its LRU max, long after they have expired.

Also, as this cache is optimized for LRU/MRU operations, some staleness/TTL checks will reduce performance.

This is not primarily a TTL cache, and does not make strong TTL guarantees. There is no pre-emptive pruning of expired items, but you may set a TTL on the cache, and it will treat expired items as missing when they are fetched, and delete them.

Optional, but must be a positive integer in ms if specified.

This may be overridden by passing an options object to `set()`.

Even if TTL tracking is enabled, it is strongly recommended to set a max to prevent unbounded growth of the cache. See "Storage Bounds Safety" below.

If TTL tracking is enabled, and `max` and `maxSize` are not set, and `ttlAutopurge` is not set, then a warning will be emitted cautioning about the potential for unbounded memory consumption.

### `noUpdateTTL`

Boolean flag to tell the cache to not update the TTL when setting a new value for an existing key (ie, when updating a value rather than inserting a new value). Note that the TTL value is always set (if provided) when adding a new entry into the cache.

This may be passed as an option to `set()`.

Boolean, default `false`.

### `ttlResolution`

Minimum amount of time in ms in which to check for staleness. Defaults to `1`, which means that the current time is checked at most once per millisecond.

Set to `0` to check the current time every time staleness is tested.

Note that setting this to a higher value _will_ improve performance somewhat while using TTL tracking, albeit at the expense of keeping stale items around a bit longer than intended.

### `ttlAutopurge`

Preemptively remove stale items from the cache.

Note that this may _significantly_ degrade performance, especially if the cache is storing a large number of items. It is almost always best to just leave the stale items in the cache, and let them fall out as new items are added.

Note that this means that `allowStale` is a bit pointless, as stale items will be deleted almost as soon as they expire.

Use with caution!

Default: `false`

### `allowStale`

By default, if you set TTL, it'll only delete stale items from the cache when you `get(key)`. That is, it's not preemptively pruning items.

If you set `allowStale:true`, it'll return the stale value as well as deleting it. If you don't set this, then it'll return `undefined` when you try to get a stale entry.

Note that when a stale entry is fetched, even if it is returned due to `allowStale` being set, it is removed from the cache immediately. You can immediately put it back in the cache if you wish, thus resetting the TTL.

This may be overridden by passing an options object to `get()`. The `has()` method will always return `false` for stale items.

Boolean, default `false`, only relevant if `ttl` is set.

### `noDeleteOnStaleGet`

When using time-expiring entries with `ttl`, by default stale items will be removed from the cache when the key is accessed with `get()`.

Setting `noDeleteOnStaleGet` to `true` will cause stale items to remain in the cache, until they are explicitly deleted with `delete(key)`, or retrieved with `noDeleteOnStaleGet` set to `false`.

This may be overridden by passing an options object to `get()`.

Boolean, default `false`, only relevant if `ttl` is set.

### `updateAgeOnGet`

When using time-expiring entries with `ttl`, setting this to `true` will make each item's age reset to `0` whenever it is retrieved from cache with `get()`, causing it to not expire. (It can still fall out of cache based on recency of use, of course.)

    This may be overridden by passing an options object to `get()`.

    Boolean, default `false`, only relevant if `ttl` is set.

### `updateAgeOnHas`

When using time-expiring entries with `ttl`, setting this to `true` will make each item's age reset to `0` whenever its presence in the cache is checked with `has()`, causing it to not expire. (It can still fall out of cache based on recency of use, of course.)

This may be overridden by passing an options object to `has()`.

Boolean, default `false`, only relevant if `ttl` is set.

## API

```ts
import {
	Disposer,
	Entry,
	Fetcher,
	FetcherOptions,
	GetOptions,
	HasOptions,
	PeekOptions,
	SetOptions,
	SizeCalculator
} from 'lru-cache';

interface LruCache<K = any, V = any> {
	readonly max: number;
	readonly maxSize: number;
	readonly maxEntrySize: number;
	readonly calculatedSize: number;
	readonly sizeCalculation?: SizeCalculator<K, V>;
	readonly ttl: number;
	readonly ttlResolution: number;
	readonly ttlAutopurge: boolean;
	readonly allowStale: boolean;
	readonly updateAgeOnGet: boolean;
	readonly updateAgeOnHas: boolean;
	readonly noDeleteOnStaleGet: boolean;
	readonly dispose: Disposer<K, V>;
	readonly disposeAfter: Disposer<K, V> | null;
	readonly noDisposeOnSet: boolean;
	readonly fetchMethod: Fetcher<K, V> | null;
	readonly size: number;

	has(key: K, options?: HasOptions): boolean;

	get<T = unknown>(key: K, options?: GetOptions): T | undefined;

	peek<T = unknown>(key: K, options?: PeekOptions): T | undefined;

	set(key: K, value: V, ttl?: number): this;

	set(key: K, value: V, options?: SetOptions<K, V>): this;

	delete(key: K): boolean;

	clear(): void;

	pop(): V | undefined;

	purgeStale(): boolean;

	find<T = V>(
		callbackFn: (value: V, key: K, cache: LruCache<K, V>) => boolean | undefined | void,
		options?: GetOptions
	): T;

	forEach<T = this>(callbackFn: (this: T, value: V, key: K, cache: LruCache<K, V>) => void, thisArg?: T): void;

	rforEach<T = this>(callbackFn: (this: T, value: V, key: K, cache: LruCache<K, V>) => void, thisArg?: T): void;

	getRemainingTTL(key: K): number;

	keys(): Generator<K>;

	rkeys(): Generator<K>;

	values(): Generator<V>;

	rvalues(): Generator<V>;

	entries(): Generator<[K, V]>;

	rentries(): Generator<[K, V]>;

	dump(): Array<[K, Entry<V>]>;

	load(cacheEntries: ReadonlyArray<[K, Entry<V>]>): void;

	fetch<ExpectedValue = V>(key: K, options?: FetcherOptions<K, V>): Promise<ExpectedValue | undefined>;

	[Symbol.iterator](): Iterator<[K, V]>;
}
```

All [options](#options) are exposed as public read only members on the cache provider.

### `size`

The total number of items held in the cache at the current moment.

### `has(key, { allowStale })`

Check if a key is in the cache, without updating the recency of use. Age is updated if `updateAgeOnHas` is set to `true` in either the options or the constructor.

Will return `false` if the item is stale, even though it is technically in the cache.

### `get(key, { allowStale, updateAgeOnGet, noDeleteOnStaleGet })`

Returns a value from the cache.

Will update the recency of the cache entry found.

If the key is not found, `get()` will return undefined. This can be confusing when setting values specifically to undefined, as in `set(key, undefined)`. Use `has()` to determine whether a key is present in the cache at all.

### `peek(key, { allowStale })`

Like `get()` but doesn't update recency or delete stale items.

Returns `undefined` if the item is stale, unless `allowStale` is set either on the cache or in the options object.

### `set(key, value, ttl)`

### `set(key, value, { ttl, size, sizeCalculation, start, noDisposeOnSet, noUpdateTTL })`

Add a value to the cache.

The third argument can be either number TTL or options object.

Optional options object may contain `ttl` and `sizeCalculation` as described above, which default to the settings on the cache object.

If `start` is provided, then that will set the effective start time for the TTL calculation. Note that this must be a previous value of `performance.now()` if supported, or a previous value of `Date.now()` if not.

Options object my also include `size`, which will prevent calling the `sizeCalculation` function and just use the specified number if it is a positive integer, and `noDisposeOnSet` which will prevent calling a `dispose` function in the case of overwrites.

If the `size` (or return value of `sizeCalculation`) is greater than `maxSize`, then the item will not be added to the cache.

Will update the recency of the entry.

Returns the cache service itself.

`ttl` and `noUpdateTTL` optionally override defaults on the module [options](#options).

Returns the cache object itself.

### `delete(key)`

Deletes a key out of the cache.

Returns `true` if the key was deleted, `false` otherwise.

### `clear()`

Clear the cache entirely, throwing away all values.

### `keys()`

Return a generator yielding the keys in the cache, in order from most recently used to least recently used.

```ts
for (const key of cacheService.keys()) {
	// ...
}
```

### `rkeys()`

Return a generator yielding the keys in the cache, in order from least recently used to most recently used.

### `values()`

Return a generator yielding the values in the cache, in order from most recently used to least recently used.

```ts
for (const value of cacheService.values()) {
	// ...
}
```

### `rvalues()`

Return a generator yielding the values in the cache, in order from least recently used to most recently used.

### `entries()`

Return a generator yielding `[key, value]` pairs, in order from most recently used to least recently used.

```ts
for (const [key, value] of cacheService.entries()) {
	// ...
}
```

### `rentries()`

Return a generator yielding `[key, value]` pairs, in order from least recently used to most recently used.

### `find(fn, { allowStale, updateAgeOnGet, noDeleteOnStaleGet })`

Find a value for which the supplied fn method returns a truthy value, similar to `Array.find()`.

`fn` is called as `fn(value, key, cache)`.

The options are applied to the resulting `get()` of the item found.

### `dump()`

Return an array of `[key, entry]` objects which can be passed to `load()`.

The `start` fields are calculated relative to a portable `Date.now()` timestamp, even if `performance.now()` is available.

Stale entries are always included in the dump, even if `allowStale` is `false`.

Note: this returns an actual array, not a generator, so it can be more easily passed around.

### `load(entries)`

Reset the cache and load in the items in `entries` in the order listed. Note that the shape of the resulting cache may be different if the same options are not used in both caches.

The `start` fields are assumed to be calculated relative to a portable `Date.now()` timestamp, even if `performance.now()` is available.

### `purgeStale()`

Delete any stale entries. Returns `true` if anything was removed, `false` otherwise.

### `getRemainingTTL(key)`

Return the number of milliseconds left in the item's TTL. If item is not in cache, returns `0`. Returns `Infinity` if item is in cache without a defined TTL.

### `forEach(fn, thisp)`

Call the `fn` function with each set of `fn(value, key, cache)` in the LRU cache, from most recent to least recently used.

Does not affect recency of use.

If `thisp` is provided, function will be called in the this-context of the provided object.

### `rforEach(fn, thisp)`

Same as `forEach(fn, thisp?)`, but in order from least recently used to most recently used.

### `pop()`

Evict the least recently used item, returning its value.

Returns `undefined` if cache is empty.

### `Symbol.iterator`

The cache service supports iterations over itself.

```ts
for (const [key, value] of cacheService) {
	// ...
}
```

## Decorators

A good way to implement automatic caching logic at class methods level is to use caching decorators.

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached()
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

The decorators internally generate a cache key of the following pattern: `<className><?_instanceId>.<methodName><?:hashFunctionResult>` (`?` indicates optional part). So in the example above, the generated cache key will look like this: `AnyCustomProvider.getRandomNumber`.

```ts
// With @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194

// Without @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.24774185142387684
anyCustomProvider.getRandomNumber(); // -> 0.7533487702318598
```

This will work as expected if you have the single instance of the class. But if you have multiple instances of the same class (e.g. `TRANSIENT` or `REQUEST` scoped), **they will use the shared cache by default**. In order to separate them, you need to apply the `@Cacheable` decorator on the class.

### @Cacheable

The `@Cacheable` decorator makes each class instance to use separate cache.

```ts
import { Injectable } from '@nestjs/common';
import { Cacheable, Cached } from 'nestjs-lru-cache';

@Injectable({ scope: Scope.TRANSIENT })
@Cacheable()
export class AnyCustomProvider {
	@Cached()
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

The `@Cacheable` decorator assigns the unique identifier for each created instance. Thus, `@Cached` and `@CachedAsync` decorators can use it to generate unique cache keys, for example: `AnyCustomProvider_1.getRandomNumber`, `AnyCustomProvider_2.getRandomNumber`, and so on.

```ts
// With @Cacheable()
// Different class instances use separate cache
anyCustomProvider1.getRandomNumber(); // -> 0.2477418514238761
anyCustomProvider2.getRandomNumber(); // -> 0.7533487702318598

// Without @Cacheable()
// Different class instances use the shared cache
anyCustomProvider1.getRandomNumber(); // -> 0.6607802129894669
anyCustomProvider2.getRandomNumber(); // -> 0.6607802129894669
```

If you're happy with different instances sharing the same cache, then don't apply this decorator. There is also a way to force some cached methods to use the shared cache by passing `useSharedCache` option to the `@Cached` or `@CachedAsync` decorators, even if the class is decorated with `@Cacheable` decorator. See below for more information.

### @Cached

```ts
@Cached(number)
@Cached((...args: any[]) => string)
@Cached<K = any, V = any>({
	hashFunction: (...args: any[]) => string,
	useArgumentOptions: boolean,
	useSharedCache: boolean,
	ttl: number,
	sizeCalculation: (value: V, key: K) => number,
	noDisposeOnSet: boolean,
	noUpdateTTL: boolean,
	updateAgeOnHas: boolean,
	updateAgeOnGet: boolean,
	noDeleteOnStaleGet: boolean
})
```

The `@Cached` decorator can be used to apply automatic caching logic to _synchronous_ methods and getters. To decorate asynchronous methods use [@CachedAsync](#cachedasync) decorator instead.

The `@Cached` decorator allows you to set the TTL at the decorated method level, which will override the default value specified in the module [options](#options). To set TTL, you can pass the number of milliseconds as the first argument to the decorated method.

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached(5000)
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

If the decorated method has no parameters, you can use it as is as shown in the above examples. However, if the method has parameters, then by default they are not involved in the generation of the cache key, and calling the method with different arguments will result in the same cache key generation. To work around this issue, you can provide a function as the first argument that accepts the same parameters as the decorated method and returns a string.

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-lru-cache';

@Injectable()
export class UsersService {
	@Cached((id: number) => String(id))
	public getUserById(id: number): User {
		// ...
	}
}
```

The resulting string will be appended to the cache key: `UsersService.getUserById:123456789`.

In this way you can stringify any data structure in the function, for example a plain object:

```ts
import { Injectable } from '@nestjs/common';
import { Cached } from 'nestjs-lru-cache';

interface UsersOptions {
	status: string;
	role: string;
	isDeleted?: boolean;
}

@Injectable()
export class UsersService {
	@Cached((options: UsersOptions) => {
		return `${options.role}_${options.status}_${options.isDeleted}`;
	})
	public getUsers(options: UsersOptions): User[] {
		// ...
	}
}
```

The resulting cache key will look something like this: `UsersService.getUsers:manager_online_false`.

> **NOTE:** You're better off not using `JSON.stringify()` to convert objects to strings. If two identical objects with the same properties and values are passed with a different order of properties, this will generate different keys, for example, `{"key":1,"val":1}` and `{"val":1,"key":1}`.

By default, the `@Cached` decorator will use the default [options](#options) specified on module registration, but it also ships its own options and allows you to override the default options for the decorated method.

### @Cached Options

```ts
interface CachedDecoratorOptions<K = any, V = any> {
	hashFunction?: (...args: any[]) => string;
	useSharedCache?: boolean;
	useArgumentOptions?: boolean;
	ttl?: number;
	sizeCalculation: (value: V, key: K) => number;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnHas?: boolean;
	updateAgeOnGet?: boolean;
	noDeleteOnStaleGet?: boolean;
}
```

The `@Cached` decorator can accept options object as the first argument instead of hash function. These options allow you to flexibly control caching behavior for a single decorated method.

> **NOTE:** Some options listed below override similar options specified in module [options](#options). If they are not set, the default values will be used.

> **WARNING:** Make sure you set TTL in the decorator options or default TTL in module options. If you don't set TTL, this may cause the decorated method to always return the cached result, even if you set `max` or `maxSize` limiters.

-   `hashFunction` - A function that accepts the same parameters as the decorated method and returns a string that will be appended to the generated cache key. You can specify it as the first argument or use this property in the options object.
-   `useSharedCache` - Whether the decorated method should use shared cache across multiple class instances, even if the class is decorated with `@Cacheable` decorator. Defaults to `false`.
-   `useArgumentOptions` - Makes the decorator use [argument options](#argument-options) passed as the last argument to the decorated method to control caching behavior for **one specific method call**. See below for more information. Defaults to `false`.
-   `ttl` - Max time to live for items before they are considered stale.
-   `sizeCalculation` - Function used to calculate the size of stored entries. If you're storing strings or buffers, then you probably want to do something like `n => n.length`. The item is passed as the first argument, and the key is passed as the second argument.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing entry.
-   `updateAgeOnGet` - Whether the age of an entry should be updated on `get()`.
-   `updateAgeOnHas` - Whether the age of an entry should be updated on `has()`.
-   `noDeleteOnStaleGet` - Setting to `true` will cause stale entries to remain in the cache, until they are explicitly deleted with `delete(key)`, or retrieved with `noDeleteOnStaleGet` set to `false`.

The example below shows how you can apply some cache options at the method level.

```ts
import { Injectable } from '@nestjs/common';
import { Cacheable, Cached } from 'nestjs-lru-cache';

@Injectable({ scope: Scope.TRANSIENT })
@Cacheable()
export class AnyCustomProvider {
	@Cached({ ttl: 10000, updateAgeOnGet: true })
	public getRandomNumber(): number {
		return Math.random();
	}

	@Cached({ ttl: 5000, useSharedCache: true })
	public getRandomNumberShared(): number {
		return Math.random();
	}
}
```

```ts
// @Cacheable() without `useSharedCache` option
// Different class instances use separate cache
anyCustomProvider1.getRandomNumber(); // -> 0.2477418514238761
anyCustomProvider2.getRandomNumber(); // -> 0.7533487702318598

// @Cacheable() with `useSharedCache` option passed to the decorator
// Different class instances use shared cache only for this method
anyCustomProvider1.getRandomNumberShared(); // -> 0.6607802129894669
anyCustomProvider2.getRandomNumberShared(); // -> 0.6607802129894669
```

### @CachedAsync

```ts
@CachedAsync(number)
@CachedAsync((...args: any[]) => string)
@CachedAsync<K = any, V = any>({
	hashFunction: (...args: any[]) => string,
	useSharedCache: boolean,
	useArgumentOptions: boolean,
	cachePromise: boolean,
	cachePromiseResult: boolean,
	ttl: number,
	sizeCalculation: (value: V, key: K) => number,
	noDisposeOnSet: boolean,
	noUpdateTTL: boolean,
	updateAgeOnHas: boolean,
	updateAgeOnGet: boolean,
	noDeleteOnStaleGet: boolean
})
```

The `@CachedAsync` decorator designed for asynchronous methods. It is able to cache not only the promise result, but the promise itself.

```ts
import { Injectable } from '@nestjs/common';
import { CachedAsync } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@CachedAsync({ ttl: 5000, updateAgeOnGet: true })
	public async getRandomNumberAsync(): Promise<number> {
		return Math.random();
	}
}
```

```ts
// With @CachedAsync() decorator
// Not awaited calls return the same promise
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387612 }

// Without @CachedAsync() decorator
// Not awaited calls return new promises for each call.
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.01035534046752562 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.19166009286482677 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.04037471223786249 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387613 }
```

In the example above, the first call of `getRandomNumberAsync()` method caches and returns a promise, the next 3 calls return the already cached promise created by the first method call. So all 4 calls waiting for the same promise to be resolved. Without `@CachedAsync` decorator 4 calls of `getRandomNumberAsync()` return a new promise for each call.

This behavior can be useful to call rate-limited third-party APIs to avoid wasting limits, or for complex database queries to maintain performance.

After expiration (5000 ms in the example) the promise will be deleted from the cache, so the next call will return a new promise.

The result of the promise is also caching for the specified TTL. For example, if you set the TTL value to `5000` ms and the promise resolves after `2000` ms, then the result of the promise will be cached, resetting the TTL back to `5000` ms. You can disable TTL update providing `noUpdateTTL: true` to the `@CachedAsync` options object, so the result of the promise will be cached for the remaining `3000` ms.

### @CachedAsync Options

```ts
interface CachedAsyncDecoratorOptions<K = any, V = any> {
	hashFunction?: (...args: any[]) => string;
	useSharedCache?: boolean;
	useArgumentOptions?: boolean;
	cachePromise?: boolean;
	cachePromiseResult?: boolean;
	ttl?: number;
	sizeCalculation?: SizeCalculator<K, V>;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnHas?: boolean;
	updateAgeOnGet?: boolean;
	noDeleteOnStaleGet?: boolean;
}
```

The `@CachedAsync` decorator accepts the same [options](#cached-options) as the `@Cached` decorator, but adds a few new ones:

-   `cachePromise` - Whether to cache the promise itself. If set to `false`, only the result of the promise will be cached (the latest resolved). Defaults to `true`.
-   `cachePromiseResult` - Whether to cache the result of the promise. If set to `false`, the promise will be deleted fom the cache after resolution without caching the result. Defaults to `true`.

## Argument options

```ts
interface CacheArgumentOptions {
	returnCached?: boolean;
	useSharedCache?: boolean;
	ttl?: number;
	size?: number;
	sizeCalculation?: SizeCalculator<K, V>;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	updateAgeOnHas?: boolean;
	updateAgeOnGet?: boolean;
	noDeleteOnStaleGet?: boolean;
}
```

Argument options are a way to change caching behavior for **one specific method call** by providing cache options as the last argument in the method.

Some options listed below override similar [options](#cached-options) in the decorator. If they are not specified here, the decorator options will be used.

-   `returnCached` - Whether to return the cached value. If set to `false`, the original method will be called even if the cached result is available in the cache. The new value replaces the cached one as usual. Defaults to `true`.
-   `useSharedCache` - Whether a specific method call should use the shared cache across multiple class instances, even if [@Cacheable](#cacheable) decorator has been applied to the class. Defaults to the value specified in the [@Cached decorator options](#cached-options).
-   `ttl` - Max time to live for items before they are considered stale.
-   `size` - The size of entry to add. Prevents calling the `sizeCalculation` function and just use the specified number if it is a positive integer.
-   `sizeCalculation` - Function used to calculate the size of stored entries. If you're storing strings or buffers, then you probably want to do something like `n => n.length`. The item is passed as the first argument, and the key is passed as the second argument.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing entry.
-   `updateAgeOnGet` - Whether the age of an entry should be updated on `get()`.
-   `updateAgeOnHas` - Whether the age of an entry should be updated on `has()`.
-   `noDeleteOnStaleGet` - Setting to `true` will cause stale entries to remain in the cache, until they are explicitly deleted with `delete(key)`, or retrieved with `noDeleteOnStaleGet` set to `false`.

To be able to use argument options, you _must_ set `useArgumentOptions` to `true` in the decorator options. Otherwise, they will be ignored.

```ts
import { Injectable } from '@nestjs/common';
import { Cached, CachedAsync, CacheArgumentOptions } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached({ ttl: 5000, useArgumentOptions: true })
	public getRandomNumber(options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 5000, useArgumentOptions: true })
	public async getUserById(id: number, options?: CachedAsyncArgumentOptions): Promise<User> {
		// ...
	}
}
```

After enabling `useArgumentOptions`, you can declare the argument options as the last optional parameter of the decorated method. **Only the last argument will be considered as a potential cache options object**.

```ts
// You can use the decorated method as usual:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// Call again to return the cached result:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// And you can pass `returnCached` option to ignore
// the cached value and get a new one:
anyCustomProvider.getRandomNumber({ returnCached: false });
// ->  0.24774185142387612
```
