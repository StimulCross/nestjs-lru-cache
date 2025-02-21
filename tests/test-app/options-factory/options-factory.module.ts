import { Module } from '@nestjs/common';
import { OptionsFactory } from './options-factory';

@Module({
	providers: [OptionsFactory],
	exports: [OptionsFactory],
})
export class OptionsFactoryModule {}
