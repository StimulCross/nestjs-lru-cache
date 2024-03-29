# NestJS LRU Cache

> **WARNING:** Although this library has been automatically (100% covered) and manually tested, it may still have fundamental design issues.

### Table of Contents

-   [Installation](#installation)
-   [Introduction](#introduction)
-   [General Usage](#general-usage)
-   [Options](#options)
-   [API](#api)
-   [Decorators](#decorators)
    -   [@Cacheable](#cacheable)
    -   [@Cached](#cached)
        -   [@Cached Options](#cached-options)
    -   [@CachedAsync](#cachedasync)
        -   [@CachedAsync Options](#cachedasync-options)
    -   [Argument Options](#argument-options)
-   [Tests](#tests)
    -   [Coverage](#coverage)
-   [Support](#support)

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

Specify a max number of the most recently used entries that you want to keep, and this cache will keep that many of the most recently accessed entries.

Although this library supports TTL, it does not make strong TTL guarantees. There is no preemptive pruning of expired entries by default, but you _may_ set a TTL on the cache or on a single set. If you do so, it will treat expired entries as missing, and delete them when fetched. If you are more interested in TTL caching than LRU caching, consider using [nestjs-ttl-cache](https://github.com/stimulcross/nestjs-ttl-cache) - a NestJS wrapper for [@isaacs/ttlcache](https://github.com/isaacs/ttlcache) library.

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

See [API](#api) section below for the cache usage information.

## Options

```ts
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

> **TIP:** Read the detailed description of each option in the original [lru-cache repository](https://github.com/isaacs/node-lru-cache/blob/main/README.md#options).

## API

```ts
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
	get<T = V>(key: K, options?: GetOptions): T | undefined;
	peek<T = V>(key: K, options?: PeekOptions): T | undefined;
	set(key: K, value: V, ttl?: number): this;
	set(key: K, value: V, options?: SetOptions<K, V>): this;
	delete(key: K): boolean;
	clear(): void;
	pop(): V | undefined;
	purgeStale(): boolean;
	find<T = V>(callbackFn: (value: V, key: K, cache: this) => boolean | undefined | void, options?: GetOptions): T;
	forEach<T = this>(callbackFn: (this: T, value: V, key: K, cache: this) => void, thisArg?: T): void;
	rforEach<T = this>(callbackFn: (this: T, value: V, key: K, cache: this) => void, thisArg?: T): void;
	getRemainingTTL(key: K): number;
	keys(): Generator<K, void, void>;
	rkeys(): Generator<K, void, void>;
	values(): Generator<V, void, void>;
	rvalues(): Generator<V, void, void>;
	entries(): Generator<[K, V]>;
	rentries(): Generator<[K, V]>;
	dump(): Array<[K, Entry<V>]>;
	load(cacheEntries: ReadonlyArray<[K, Entry<V>]>): void;
	fetch<ExpectedValue = V>(key: K, options?: FetcherOptions<K, V>): Promise<ExpectedValue | undefined>;
	[Symbol.iterator](): Iterator<[K, V]>;
}
```

> **TIP:** Read the detailed description of the API in the original [lru-cache repository](https://github.com/isaacs/node-lru-cache/blob/main/README.md#api).

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

The decorators internally generate a cache key of the following pattern: `__<className><?_instanceId>.<methodName><?:hashFunctionResult>__` (`?` indicates optional part). So in the example above, the generated cache key will look like this: `__AnyCustomProvider.getRandomNumber__`.

```ts
// With @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194

// Without @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.24774185142387684
anyCustomProvider.getRandomNumber(); // -> 0.75334877023185987
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

The `@Cacheable` decorator assigns the unique identifier for each created instance. Thus, `@Cached` and `@CachedAsync` decorators can use it to generate unique cache keys, for example: `__AnyCustomProvider_1.getRandomNumber__`, `__AnyCustomProvider_2.getRandomNumber__`, and so on.

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

The `@Cached` decorator allows you to set the TTL at the decorated method level, which will override the default value specified in the module [options](#options). To set TTL, you can pass the number of milliseconds as the first argument to the decorator itself.

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

The resulting string will be appended to the cache key: `__UsersService.getUserById:123456789__`.

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

The resulting cache key will look something like this: `__UsersService.getUsers:manager_online_false__`.

> **NOTE:** You're better off not using `JSON.stringify()` to convert objects to strings. If two identical objects with the same properties and values are passed with a different order of properties, this will generate different keys, for example, `{"key":1,"val":1}` and `{"val":1,"key":1}`.

By default, the `@Cached` decorator will use the default [options](#options) specified on module registration, but it also ships its own options and allows you to override the default options for the decorated method.

### @Cached Options

```ts
interface CachedDecoratorOptions<K = any, V = any> {
	hashFunction?: (...args: any[]) => string;
	useSharedCache?: boolean;
	useArgumentOptions?: boolean;
	ttl?: number;
	size?: number;
	sizeCalculation?: (value: V, key: K) => number;
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
-   `ttl` - Max time to live for entries before they are considered stale.
-   `size` - The size of entry to add. Prevents calling the `sizeCalculation` function and just use the specified number if it is a positive integer.
-   `sizeCalculation` - Function used to calculate the size of stored entries. If you're storing strings or buffers, then you probably want to do something like `n => n.length`. The entry is passed as the first argument, and the key is passed as the second argument.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing entry.
-   `updateAgeOnGet` - Whether the age of an entry should be updated on `get()` (when the decorator gets the cached result of the decorated getter/method).
-   `updateAgeOnHas` - Whether the age of an entry should be updated on `has()` (when the decorator checks if the decorated getter/method has a cached result).
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
// Not awaited calls return a new promise for each call.
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.01035534046752562 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.19166009286482677 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.04037471223786249 }
anyCustomProvider.getRandomNumberAsync(); // -> Promise { 0.24774185142387613 }
```

In the example above, the first call of `getRandomNumberAsync()` method caches and returns a promise, the next 3 calls return the already cached promise created by the first method call. So all 4 calls waiting for the same promise to be resolved. Without `@CachedAsync` decorator 4 calls of `getRandomNumberAsync()` return a new promise for each call.

This behavior can be useful to call rate-limited third-party APIs to avoid wasting limits, or for complex database queries to maintain performance.

After expiration (5000 ms in the example) the promise will be deleted from the cache, so the next call will return a new promise.

The result of the promise is also caching for the specified TTL. For example, if you set the TTL value to 5000 ms and the promise resolves after 2000 ms, then the result of the promise will be cached, resetting the TTL back to 5000 ms. You can disable TTL update providing `noUpdateTTL: true` to the `@CachedAsync` options object, so the result of the promise will be cached for the remaining 3000 ms.

### @CachedAsync Options

```ts
interface CachedAsyncDecoratorOptions<K = any, V = any> {
	hashFunction?: (...args: any[]) => string;
	useSharedCache?: boolean;
	useArgumentOptions?: boolean;
	cachePromise?: boolean;
	cachePromiseResult?: boolean;
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
-   `ttl` - Max time to live for entries before they are considered stale.
-   `size` - The size of entry to add. Prevents calling the `sizeCalculation` function and just use the specified number if it is a positive integer.
-   `sizeCalculation` - Function used to calculate the size of stored entries. If you're storing strings or buffers, then you probably want to do something like `n => n.length`. The entry is passed as the first argument, and the key is passed as the second argument.
-   `noDisposeOnSet` - Whether the `dispose()` function should be called if the entry key is still accessible within the cache.
-   `noUpdateTTL` - Whether to not update the TTL when overwriting an existing entry.
-   `updateAgeOnGet` - Whether the age of an entry should be updated on `get()` (when the decorator gets the cached result of the decorated getter/method).
-   `updateAgeOnHas` - Whether the age of an entry should be updated on `has()` (when the decorator checks if the decorated getter/method has a cached result).
-   `noDeleteOnStaleGet` - Setting to `true` will cause stale entries to remain in the cache, until they are explicitly deleted with `delete(key)`, or retrieved with `noDeleteOnStaleGet` set to `false`.

To be able to use argument options, you _must_ set `useArgumentOptions` to `true` in the decorator options. Otherwise, they will be ignored.

```ts
import { Injectable } from '@nestjs/common';
import { Cached, CachedAsync, CacheArgumentOptions } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached({ ttl: 5000, useArgumentOptions: true })
	public getRandomNumber(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 5000, useArgumentOptions: true })
	public async getUserById(id: number, _options?: CacheArgumentOptions): Promise<User> {
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

// And you can pass `returnCached: false` to ignore
// the cached value and get a new one:
anyCustomProvider.getRandomNumber({ returnCached: false });
// ->  0.24774185142387612
```

## Tests

Available test commands `test`, `test:verbose`, `test:cov`, `test:cov:verbose`.

### Coverage

`test:cov` output:

```
 PASS  tests/cached-async.decorator.spec.ts
 PASS  tests/cached.decorator.spec.ts
 PASS  tests/lru-cache.spec.ts
 PASS  tests/lru-cache.module.spec.ts
 PASS  tests/cacheable.decorator.spec.ts
----------------------------|---------|----------|---------|---------|-------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|-------------------
All files                   |     100 |      100 |     100 |     100 |
 src                        |     100 |      100 |     100 |     100 |
  constants.ts              |     100 |      100 |     100 |     100 |
  lru-cache.module.ts       |     100 |      100 |     100 |     100 |
 src/decorators             |     100 |      100 |     100 |     100 |
  cacheable.decorator.ts    |     100 |      100 |     100 |     100 |
  cached-async.decorator.ts |     100 |      100 |     100 |     100 |
  cached.decorator.ts       |     100 |      100 |     100 |     100 |
 src/providers              |     100 |      100 |     100 |     100 |
  lru-cache.ts              |     100 |      100 |     100 |     100 |
 src/utils                  |     100 |      100 |     100 |     100 |
  is-object.ts              |     100 |      100 |     100 |     100 |
  wrap-cache-key.ts         |     100 |      100 |     100 |     100 |
----------------------------|---------|----------|---------|---------|-------------------

Test Suites: 5 passed, 5 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        5.602 s, estimated 6 s
Ran all test suites.
Done in 6.24s.
```

## Support

If you run into problems, or you have suggestions for improvements, please submit a new [issue](https://github.com/StimulCross/nestjs-lru-cache/issues) 🙃
