import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Growing-up Formula' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Formula untuk anak usia 1-3 tahun' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://example.com/images/growing-up-formula.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
