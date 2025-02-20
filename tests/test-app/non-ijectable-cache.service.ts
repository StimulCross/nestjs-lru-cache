import { Injectable } from '@nestjs/common';
import { CachedAsync, Cached } from '../../src';

@Injectable()
export class NonInjectableCacheService {
	@Cached({ ttl: 100 })
	public getRandomNumber(): number {
		return Math.random();
	}

	@CachedAsync({ ttl: 100 })
	public async getRandomNumberAsync(): Promise<number> {
		return Math.random();
	}
}
