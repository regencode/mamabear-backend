import { IsBoolean, IsNumber, IsOptional, IsString, IsNotEmpty } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CreateProductDto {

    @ApiProperty({ example: "S-26 Procal Gold 3" })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty({ example: "Growing-up formula for children aged 1-3 years." })
    @IsString()
    description: string

    @ApiProperty({ example: 900 })
    @IsNumber()
    weight_g: number                                                            

    @ApiProperty({ example: 185000 })
    @IsNumber()
    price_idr: number

    @ApiPropertyOptional({ example: 50 })
    @IsNumber()
    @IsOptional()
    stock?: number

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean

    @ApiPropertyOptional({ example: "S26-PROCAL-3-900" })
    @IsString()
    @IsOptional()
    sku?: string                                                           
}
