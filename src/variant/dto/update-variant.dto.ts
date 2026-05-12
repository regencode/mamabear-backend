import { PartialType } from '@nestjs/swagger';
import { CreateVariantDto } from './create-variant.dto';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateVariantDto extends PartialType(CreateVariantDto) {
  @IsOptional()
  @IsInt()
  stock?: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
