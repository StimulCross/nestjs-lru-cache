import { Inject } from '@nestjs/common';
import { LRU_CACHE } from '../constants';

export const InjectCache = (): ReturnType<typeof Inject> => Inject(LRU_CACHE);
