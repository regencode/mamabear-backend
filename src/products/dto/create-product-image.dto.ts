import { IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductImageDto {
  @ApiProperty({
    example:
      'https://raw.githubusercontent.com/regencode/mamabear-backend/main/assets/images/AlmonMix/AlmonMix-01.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({ example: 'MamaBear AlmonMix 01' })
  @IsString()
  @IsOptional()
  altText?: string;
}
