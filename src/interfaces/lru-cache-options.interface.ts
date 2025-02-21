import { type LRUCache } from 'lru-cache';

/**
 * LRU cache options passed directly to the underlying LRU cache instance.
 */
export type LruCacheOptions<K = any, V = any, FC = unknown> = LRUCache.Options<K, V, FC>;
