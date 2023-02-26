import { Injectable } from '@nestjs/common';
import type { LruCacheOptionsFactory, LruCacheOptions } from '../../../src';

@Injectable()
export class OptionsFactory implements LruCacheOptionsFactory {
	async createLruCacheOptions(): Promise<LruCacheOptions> {
		return { max: 10000, ttl: 50000 };
	}
}
