import { VariantService } from './variant.service';
import { Module } from '@nestjs/common';
import { VariantRepository } from './variant.repository';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';

@Module({
  providers: [VariantService, VariantRepository],
  exports: [VariantService, VariantRepository],
})
export class VariantModule {}
