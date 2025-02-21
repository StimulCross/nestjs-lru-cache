import { Injectable } from '@nestjs/common';
import { type LruCacheOptionsFactory, type LruCacheOptions } from '../../../src';

@Injectable()
export class OptionsFactory implements LruCacheOptionsFactory {
	async createLruCacheOptions(): Promise<LruCacheOptions> {
		return { max: 10_000, ttl: 50_000 };
	}
}
