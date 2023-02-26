import { type MaybeMaxEntrySizeLimit, type SafetyBounds, type SharedOptions } from 'lru-cache';

/**
 * LRU cache options passed directly to the underlying LRU cache instance.
 */
export type LruCacheOptions<K = any, V = any> = SharedOptions<K, V> & SafetyBounds<K, V> & MaybeMaxEntrySizeLimit<K, V>;
