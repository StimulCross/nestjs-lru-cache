/** @internal */
export function wrapCacheKey(key: string): string {
	return `__${key}__`;
}
