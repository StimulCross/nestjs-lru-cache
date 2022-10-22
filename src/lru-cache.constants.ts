/**
 * Allows you to inject the original LRU cache instance using NestJS @Inject() decorator.
 *
 * @see https://github.com/isaacs/node-lru-cache/
 */
export const LRU_CACHE = 'LruCacheToken';

/** @internal */
export const LRU_CACHE_OPTIONS = 'LruCacheOptionsToken';

/** @internal */
export const CACHE_INSTANCES_PROPERTY = '__cache_instances__';

/** @internal */
export const CACHE_INSTANCE_ID_PROPERTY = '__cache_instance_id__';

/** @internal */
export const CACHE_INSTANCE = '__cache__';
