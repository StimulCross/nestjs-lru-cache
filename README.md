# NestJS LRU Cache

### Table of Contents

-   [Installation](#installation)
-   [Introduction](#introduction)
-   [General Usage](#general-usage)
-   [Options](#options)
-   [API](#api)
-   [Decorators](#decorators)
    -   [@IsolatedCache](#isolatedcache)
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
npm i --save nestjs-lru-cache lru-cache
```

Using **yarn**:

```
yarn add nestjs-lru-cache lru-cache
```

Using **pnpm**:

```
pnpm add nestjs-lru-cache lru-cache
```

## Introduction

This is a NestJS wrapper around popular [lru-cache](https://github.com/isaacs/node-lru-cache) library, one of the most performant LRU cache implementations available, with support for fancy **[cache decorators](#decorators)**.

This cache module focuses on the LRU caching strategy where the least used entries are removed from the cache.

Specify a max number of the most recently used entries that you want to keep, and this cache will keep that many of the most recently accessed entries.

Although this library supports TTL, it does not make strong TTL guarantees. There is no preemptive pruning of expired entries by default, but you _may_ set a TTL on the cache or on a single set. If you do so, it will treat expired entries as missing, and delete them when fetched. If you are more interested in TTL caching than LRU caching, consider using [nestjs-ttl-cache](https://github.com/stimulcross/nestjs-ttl-cache) - a NestJS wrapper for [@isaacs/ttlcache](https://github.com/isaacs/ttlcache) library.

## General Usage

First, you must register the module in your main **AppModule** using either `register` or `registerAsync` static methods.

`register` method allows you to directly set [cache options](#options):

```ts
import { Module } from '@nestjs/common';
import { LruCacheModule } from 'nestjs-lru-cache';

@Module({
	imports: [
		LruCacheModule.register({
			isGlobal: true,
			max: 10000,
		}),
	],
})
export class AppModule {}
```

`registerAsync` method allows you to use one of the following options factories: `useFactory`, `useClass`, or `useExisting`. If you need to dynamically generate cache options, for example, using your `ConfigService`, you can do it using `useFactory` function like this:

```ts
import { Module } from '@nestjs/common';
import { LruCacheModule, LruCacheOptions } from 'nestjs-lru-cache';

@Module({
	imports: [
		ConfigModule.register({
			isGlobal: true,
			cache: true,
		}),
		LruCacheModule.registerAsync({
			isGlobal: true,
			inject: [ConfigService],
			useFactory: async (configService: ConfigService): Promise<LruCacheOptions> => {
				return {
					max: Number(configService.get('CACHE_MAX')),
					ttl: Number(configService.get('CACHE_TTL')),
				};
			},
		}),
	],
})
export class AppModule {}
```

The `ConfigService` will be injected into the `useFactory` function. Note that in the example above, `ConfigModule` is global, so it does not need to be imported to the `LruCacheModule`.

Alternatively, you can employ class factories using `useClass` or `useExisting`. The `useClass` option creates a new instance of the specified class, whereas `useExisting` returns the shared instance. Note that the provider must implement the `LruCacheOptionsFactory` interface.

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
			ttl: 10000,
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
			useExisting: OptionsFactory,
		}),
	],
})
export class AppModule {}
```

Once the module is registered, original `LRUCache` instance can be injected as a dependency using `LRU_CACHE` token or `@InjectCache` decorator.

Note that `LruCacheModule` is registered as a global module, so it does not need to be imported into other modules.

```ts
import { Inject, Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { LRU_CACHE } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(@Inject(LRU_CACHE) private readonly _cache: LRUCache<{}, {}>) {}
}
```

Or

```ts
import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { InjectCache } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	constructor(@InjectCache() private readonly _cache: LRUCache<{}, {}>) {}
}
```

## Options

The `LruCacheOptions` type inherits the configuration options from the underlying `lru-cache` library. For a complete list of available options, please refer to the official [lru-cache documentation](https://isaacs.github.io/node-lru-cache/types/LRUCache.Options.html).

This is a quick reference provided for your convenience, but it may be subject to changes over time. Please always consult the official documentation for the most accurate and up-to-date information.

```ts
interface LruCacheOptions<K, V, FC> {
	max?: Count;
	ttl?: Milliseconds;
	ttlResolution?: Milliseconds;
	ttlAutopurge?: boolean;
	updateAgeOnGet?: boolean;
	updateAgeOnHas?: boolean;
	allowStale?: boolean;
	dispose?: Disposer<K, V>;
	disposeAfter?: Disposer<K, V>;
	noDisposeOnSet?: boolean;
	noUpdateTTL?: boolean;
	maxSize?: Size;
	maxEntrySize?: Size;
	sizeCalculation?: SizeCalculator<K, V>;
	fetchMethod?: Fetcher<K, V, FC>;
	memoMethod?: Memoizer<K, V, FC>;
	noDeleteOnFetchRejection?: boolean;
	noDeleteOnStaleGet?: boolean;
	allowStaleOnFetchRejection?: boolean;
	allowStaleOnFetchAbort?: boolean;
	ignoreFetchAbort?: boolean;
}
```

> [!IMPORTANT]
> At least one of `max`, `ttl`, or `maxSize` is required, to prevent unsafe unbounded storage.

## API

For a comprehensive look at all available methods and proeprties, please refer to the official [lru-cache documentation](https://isaacs.github.io/node-lru-cache/classes/LRUCache-1.html).

This is a quick reference provided for your convenience, but it may be subject to changes over time. Please always consult the official documentation for the most accurate and up-to-date information.

```ts
interface LRUCache<K, V, FC> {
	readonly max: LRUCache.Count;
	readonly maxSize: LRUCache.Count;
	readonly calculatedSize: LRUCache.Size;
	readonly size: LRUCache.Count;
	readonly fetchMethod: LRUCache.Fetcher<K, V, FC> | undefined;
	readonly memoMethod: LRUCache.Memoizer<K, V, FC> | undefined;
	readonly dispose: LRUCache.Disposer<K, V> | undefined;
	readonly disposeAfter: LRUCache.Disposer<K, V> | undefined;

	get(k: K, getOptions?: LRUCache.GetOptions<K, V, FC>): V | undefined;
	set(k: K, v: V | BackgroundFetch<V> | undefined, setOptions?: LRUCache.SetOptions<K, V, FC>): this;
	has(k: K, hasOptions?: LRUCache.HasOptions<K, V, FC>): boolean;
	delete(k: K): boolean;
	clear(): void;
	peek(k: K, peekOptions?: LRUCache.PeekOptions<K, V, FC>): V | undefined;
	pop(): V | undefined;
	find(
		fn: (v: V, k: K, self: LRUCache<K, V, FC>) => boolean,
		getOptions?: LRUCache.GetOptions<K, V, FC>,
	): V | undefined;
	info(key: K): LRUCache.Entry<V> | undefined;
	dump(): [K, LRUCache.Entry<V>][];
	load(arr: [K, LRUCache.Entry<V>][]): void;
	getRemainingTTL(key: K): number;
	purgeStale(): boolean;
	entries(): Generator<[K, V], void, unknown>;
	rentries(): Generator<(K | V)[], void, unknown>;
	keys(): Generator<K, void, unknown>;
	rkeys(): Generator<K, void, unknown>;
	values(): Generator<V, void, unknown>;
	rvalues(): Generator<V | undefined, void, unknown>;
	[Symbol.iterator](): Generator<[K, V], void, unknown>;
	[Symbol.toStringTag]: string;
	forEach(fn: (v: V, k: K, self: LRUCache<K, V, FC>) => any, thisp?: any): void;
	rforEach(fn: (v: V, k: K, self: LRUCache<K, V, FC>) => any, thisp?: any): void;
	fetch(
		k: K,
		fetchOptions: unknown extends FC
			? LRUCache.FetchOptions<K, V, FC>
			: FC extends undefined | void
			? LRUCache.FetchOptionsNoContext<K, V>
			: LRUCache.FetchOptionsWithContext<K, V, FC>,
	): Promise<undefined | V>;
	forceFetch(
		k: K,
		fetchOptions: unknown extends FC
			? LRUCache.FetchOptions<K, V, FC>
			: FC extends undefined | void
			? LRUCache.FetchOptionsNoContext<K, V>
			: LRUCache.FetchOptionsWithContext<K, V, FC>,
	): Promise<V>;
	memo(
		k: K,
		memoOptions: unknown extends FC
			? LRUCache.MemoOptions<K, V, FC>
			: FC extends undefined | void
			? LRUCache.MemoOptionsNoContext<K, V>
			: LRUCache.MemoOptionsWithContext<K, V, FC>,
	): V;
}
```

## Decorators

An effective way to implement automatic caching logic at the class-method level is to utilize caching decorators.

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

The decorators internally generate a cache key using the following pattern: `__<className><?_instanceId>.<methodName><?:hashFunctionResult>__` (the `?` indicates optional parts). For instance, in the example above, the generated cache key would look like this: `__AnyCustomProvider.getRandomNumber__`.

```ts
// With @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194
anyCustomProvider.getRandomNumber(); // -> 0.06753652490209194

// Without @Cached() decorator:
anyCustomProvider.getRandomNumber(); // -> 0.24774185142387684
anyCustomProvider.getRandomNumber(); // -> 0.75334877023185987
```

This works as expected when you only have one instance of the class. However, if you create multiple instances of the same class (for example, using `TRANSIENT` scope), all instances will share the same cache by default. To ensure each instance maintains its own cache, you should apply the `@IsolatedCache` decorator at the class level.

### @IsolatedCache

The `@IsolatedCache` decorator ensures that each class instance maintains its own isolated cache, providing instance-specific caching behavior.

```ts
import { Injectable } from '@nestjs/common';
import { IsolatedCache, Cached } from 'nestjs-lru-cache';

@Injectable({ scope: Scope.TRANSIENT })
@IsolatedCache()
export class AnyCustomProvider {
	@Cached()
	public getRandomNumber(): number {
		return Math.random();
	}
}
```

The `@IsolatedCache` decorator dynamically assigns a unique identifier to each class instance, enabling `@Cached` and `@CachedAsync` decorators to generate distinct cache keys. This mechanism ensures that cached method results are segregated by instance, preventing potential data cross-contamination. For example, different instances will have cache keys like `__AnyCustomProvider_1.getRandomNumber__` and `__AnyCustomProvider_2.getRandomNumber__`.

```ts
// With @IsolatedCache()
// Different class instances use their own isolated cache
anyCustomProvider1.getRandomNumber(); // -> 0.2477418514238761
anyCustomProvider2.getRandomNumber(); // -> 0.7533487702318598

// Without @IsolatedCache()
// Different class instances use the shared cache
anyCustomProvider1.getRandomNumber(); // -> 0.6607802129894669
anyCustomProvider2.getRandomNumber(); // -> 0.6607802129894669
```

If you're fine with different instances sharing the same cache, you don't need to apply this decorator. However, if you want certain cached methods to explicitly use the shared cache, you can pass the `useSharedCache` option to the `@Cached` or `@CachedAsync` decorators — even when the class is decorated with `@IsolatedCache`. See below for more details.

### @Cached

```ts
@Cached(number)
@Cached((...args: any[]) => string)
@Cached(options)
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

If the decorated method does not accept any parameters, you can use it as-is, as demonstrated in the examples above. However, if the method does accept parameters, note that by default they are not factored into the cache key generation. This means that invoking the method with different arguments will produce the same cache key. To address this, you can supply a function as the first argument, which should accept the same parameters as the decorated method and return a string to be used as the cache key.

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

The resulting string will be appended to the cache key, such as: `__UsersService.getUserById:123456789__`.

This approach allows you to stringify any data structure within the function, including objects.

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

The resulting cache key looks something like this: `__UsersService.getUsers:manager_online_false__`.

> [!TIP]
> Avoid using `JSON.stringify()` to convert objects to strings for key generation. Even if two objects have the same properties and values, a different order of properties can produce different strings — for instance, `{"key1":1,"key2":2}` versus `{"key2":2,"key1":1}`. This may lead to unexpected behavior when these stringified objects are used as keys.

By default, the `@Cached` decorator utilizes the [options](#options) configured during module registration. However, it also provides its own set of options, enabling you to override the default settings specifically for the decorated method.

### @Cached Options

```ts
interface CachedDecoratorOptions<K = any, V = any> {
	hashFunction?: (...args: any[]) => string;
	useSharedCache?: boolean;
	useArgumentOptions?: boolean;

	// The options below are inherited from the underlying library's options
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

The `@Cached` decorator can accept an options object as its first argument. This provides flexible control over the caching behavior on a per-method basis.

> [!NOTE]
> Some options detailed below will override corresponding module-level settings defined under [options](#options). If no value is provided, the default is used.

> [!TIP]
> Carefully consider the behavior you expect from the cached method. Depending on your default configuration (`max` and `maxSize`), the cached result of the decorated method could remain in the cache for a very long time, always returning the same result. To avoid this, it is recommended to set a `ttl` to ensure that the cached result becomes stale over time.

-   `hashFunction` - A function that accepts the same parameters as the decorated method and returns a string to be appended to the generated cache key. This function can be specified either as the first argument to the decorator or as a property within the options object.
-   `useSharedCache` - A boolean that determines whether the decorated method should share a common cache across multiple instances of the class, even if the class itself is decorated with the `@IsolatedCache` decorator. By default, this value is set to `false`.
-   `useArgumentOptions` - When set to `true`, this option directs the decorator to use the [argument options](#argument-options) provided as the last parameter of the decorated method to manage caching behavior for that specific call. By default, its value is `false`.

The library internally utilizes the cache methods (`cache.get()`, `cache.set()`, and `cache.has()`) provided by the underlying caching library. You can specify method-specific options to customize the behavior of these internal cache calls. For example, `cache.get()` accepts an options object that includes the `updateAgeOnGet` flag refreshes the TTL of a cached entry each time it is accessed. By including this flag in the decorator's options, you ensure it is consistently applied during internal `cache.get()` operations.

For a comprehensive list of available options, see [GetOptions](http://isaacs.github.io/node-lru-cache/interfaces/LRUCache.GetOptions.html), [HasOptions](http://isaacs.github.io/node-lru-cache/interfaces/LRUCache.HasOptions.html), and [SetOptions](http://isaacs.github.io/node-lru-cache/interfaces/LRUCache.SetOptions.html).

The following example demonstrates how to apply specific cache options using the `@Cached` decorator:

```ts
import { Injectable } from '@nestjs/common';
import { IsolatedCache, Cached } from 'nestjs-lru-cache';

@Injectable({ scope: Scope.TRANSIENT })
@IsolatedCache()
export class AnyCustomProvider {
	@Cached({ ttl: 10_000, updateAgeOnGet: true })
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
// @IsolatedCache() without `useSharedCache` option
// Different class instances use separate cache
anyCustomProvider1.getRandomNumber(); // -> 0.2477418514238761
anyCustomProvider2.getRandomNumber(); // -> 0.7533487702318598

// @IsolatedCache() with `useSharedCache` option passed to the decorator
// Different class instances use shared cache only for this method
anyCustomProvider1.getRandomNumberShared(); // -> 0.6607802129894669
anyCustomProvider2.getRandomNumberShared(); // -> 0.6607802129894669

// Generates a random number and caches the result.
// `updateAgeOnGet` option is enabled.
anyCustomProvider1.getRandomNumber(); // -> 0.1234567890123456
// Retrieves the cached value and refreshes the TTL,
// resetting it back to 10,000 milliseconds.
anyCustomProvider1.getRandomNumber(); // -> 0.1234567890123456
```

### @CachedAsync

```ts
@CachedAsync(number)
@CachedAsync((...args: any[]) => string)
@CachedAsync(options)
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

In this example, the first call to the `getRandomNumberAsync()` method caches and returns a promise. The subsequent three calls reuse the cached promise created by the first call. As a result, all four calls are waiting for the resolution of the same promise. Without the `@CachedAsync` decorator, each of the four calls to `getRandomNumberAsync()` would create and return a new promise independently.

This behavior is particularly useful when working with rate-limited third-party APIs to optimize the use of request limits or for executing complex database queries while preserving performance.

Once the cache expires (e.g., after 5000 ms in the example), the promise is removed from the cache, and the next method call will generate and cache a new promise.

The resolved value of the promise is also cached for the specified TTL. For instance, if the TTL is set to 5000 ms and the promise resolves after 2000 ms, the result will be cached and the TTL reset to 5000 ms. You can prevent the TTL from resetting by setting `noUpdateTTL: true` (inherited from the `LRUCache#set()` options) in the `@CachedAsync` options, ensuring the value remains cached only for the remaining 3000 ms.

### @CachedAsync Options

```ts
interface CachedAsyncDecoratorOptions<K = any, V = any> {
	hashFunction?: (...args: any[]) => string;
	useSharedCache?: boolean;
	useArgumentOptions?: boolean;
	cachePromise?: boolean;
	cachePromiseResult?: boolean;

	// The options below are inherited from the underlying library's options
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

The `@CachedAsync` decorator supports all the [options](#cached-options) available to the `@Cached` decorator, while also introducing several additional options:

-   `cachePromise` - Determines whether the promise itself should be cached. If set to `false`, only the resolved value will be stored in the cache (i.e. the latest successful result). The default value is `true`.

-   `cachePromiseResult` - Specifies whether to cache the result of the promise. When set to `false`, the promise is removed from the cache once it resolves, and its result is not stored. The default value is `true`.

## Argument options

```ts
interface CacheArgumentOptions {
	ignoreCached?: boolean;
	useSharedCache?: boolean;

	// The options below are inherited from the underlying library's options
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

Argument options allow you to modify the caching behavior for a **single method call** by providing cache options as the final parameter of the method invocation.

Some of these options will override the corresponding settings defined in the decorator's [options]

-   `ignoreCached` – Specifies whether to ignore the cached value. When set to `true`, the original method is executed regardless of a cached result, and the new result then replaces the cached one. The default value is `false`.
-   `useSharedCache` – Determines if a specific method call should use a shared cache across multiple class instances, even when the [@IsolatedCache](#isolatedcache) decorator is applied to the class. By default, it adopts the value defined in the [@Cached decorator options](#cached-options).

> [!IMPORTANT]
> To enable argument options, `useArgumentOptions` must be set to `true` in the decorator options; otherwise, they will be ignored.

```ts
import { Injectable } from '@nestjs/common';
import { Cached, CacheArgumentOptions, CachedAsyncArgumentOptions } from 'nestjs-lru-cache';

@Injectable()
export class AnyCustomProvider {
	@Cached({ ttl: 5000, useArgumentOptions: true })
	public getRandomNumber(_options?: CacheArgumentOptions): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 5000, useArgumentOptions: true })
	public async getUserById(id: number, _options?: CachedAsyncArgumentOptions): Promise<User> {
		// ...
	}
}
```

Once `useArgumentOptions` is enabled, you can pass an object with cache options as the **final, optional parameter** of the decorated method. **Only the last argument is evaluated as a potential cache options object**.

```ts
// Invoke the method as usual:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// Subsequent calls return the cached value:
anyCustomProvider.getRandomNumber();
// ->  0.19166009286482677

// Providing { ignoreCached: true } bypasses the cache and fetches a new value:
anyCustomProvider.getRandomNumber({ ignoreCached: true });
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
 PASS  tests/isolated-cache.decorator.spec.ts
------------------------------|---------|----------|---------|---------|-------------------
File                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------------|---------|----------|---------|---------|-------------------
All files                     |     100 |      100 |     100 |     100 |
 src                          |     100 |      100 |     100 |     100 |
  constants.ts                |     100 |      100 |     100 |     100 |
  lru-cache.module.ts         |     100 |      100 |     100 |     100 |
 src/decorators               |     100 |      100 |     100 |     100 |
  cached-async.decorator.ts   |     100 |      100 |     100 |     100 |
  cached.decorator.ts         |     100 |      100 |     100 |     100 |
  inject-cache.decorator.ts   |     100 |      100 |     100 |     100 |
  isolated-cache.decorator.ts |     100 |      100 |     100 |     100 |
 src/utils                    |     100 |      100 |     100 |     100 |
  is-object.ts                |     100 |      100 |     100 |     100 |
  wrap-cache-key.ts           |     100 |      100 |     100 |     100 |
------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 5 passed, 5 total
Tests:       95 passed, 95 total
Snapshots:   0 total
Time:        3.995 s, estimated 4 s
Ran all test suites.
Done in 4.47s.
```

## Support

If you run into problems, or you have suggestions for improvements, please submit a new [issue](https://github.com/StimulCross/nestjs-lru-cache/issues) 🙃
