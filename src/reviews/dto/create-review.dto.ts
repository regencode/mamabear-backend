import {
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  reviewerId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsArray()
  imageUrls: string[];
}
