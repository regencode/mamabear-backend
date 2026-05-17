import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNumber, IsOptional, Min } from "class-validator";

enum SortDirection {
    DESCENDING,
    ASCENDING,
}

export class FilterProductsDto {
    @ApiPropertyOptional({ description: "Include category (returns all categories if not selected)" })
    @IsArray()
    @IsOptional()
    categories?: string[]; // slug

    @ApiPropertyOptional({ description: "Include highlight (returns all highlights if not selected)" })
    @IsArray()
    @IsOptional()
    highlights?: string[]; // slug

    @ApiPropertyOptional({ description: "Minimum price of product" })
    @IsNumber()
    @IsOptional()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: "Maximum price of product" })
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ description: "Return only products in stock" })
    @IsNumber()
    @IsOptional()
    inStock?: boolean;

    @ApiPropertyOptional({ description: "Sort price ascending" })
    @IsEnum(SortDirection)
    @IsOptional()
    priceAscending?: SortDirection;

    @ApiPropertyOptional({ description: "Sort creation date ascending" })
    @IsEnum(SortDirection)
    @IsOptional()
    creationDateAscending?: SortDirection;

    @ApiPropertyOptional({ description: "(TODO) Sort popularity date ascending" })
    @IsEnum(SortDirection)
    @IsOptional()
    popularAscending?: SortDirection;

    @ApiPropertyOptional({ description: "(TODO) Sort rating date ascending" })
    @IsEnum(SortDirection)
    @IsOptional()
    ratingAscending?: SortDirection;
}

