import { IsNotEmpty, IsNumber, Min, Max, IsDateString, IsOptional, IsBoolean, ValidateIf } from "class-validator"


export class CreateDiscountDto {
    @IsNumber()
    @IsNotEmpty()
    variantId: number 

    @IsBoolean()
    @IsOptional()
    isPercent?: boolean

    @IsNumber()
    @IsNotEmpty()
    @ValidateIf(o => o.isPercent)
    @Min(1)
    @Max(100)
    amount: number

    @IsDateString()
    @IsOptional()
    startedAt?: string

    @IsDateString()
    @IsNotEmpty()
    endsAt: string 
}
