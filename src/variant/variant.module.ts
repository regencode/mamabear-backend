import { VariantService } from './variant.service';
import { Module } from '@nestjs/common';
import { VariantController } from './variant.controller';
import { VariantRepository } from './variant.repository';

@Module({
  controllers: [VariantController],
  providers: [VariantService, VariantRepository],
})
export class VariantModule {}
