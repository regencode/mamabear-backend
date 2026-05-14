import {
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ example: 'Great product!' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'usr_abc123def456' })
  @IsString()
  @IsNotEmpty()
  reviewerId: string;

  @ApiProperty({ example: 'My baby loves this formula. Highly recommended!' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: ['https://example.com/review-img1.jpg', 'https://example.com/review-img2.jpg'] })
  @IsArray()
  imageUrls: string[];
}
