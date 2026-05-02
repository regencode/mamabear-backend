import { IsBoolean, IsNumber, IsOptional, IsString, IsNotEmpty } from "class-validator"

export class CreateProductDto {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    description: string

    @IsNumber()
    weight_g: number                                                            

    @IsNumber()
    price_idr: number

    @IsNumber()
    @IsOptional()
    stock?: number

    @IsBoolean()
    @IsOptional()
    isActive?: boolean

    @IsString()
    @IsOptional()
    sku?: string                                                           
}
