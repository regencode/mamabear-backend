import { IsNotEmpty, IsNumber, Min, Max, IsDateString, IsOptional } from "class-validator"


export class CreateDiscountDto {
    @IsNumber()
    @IsNotEmpty()
    variantId: number 

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(100)
    amountPercent: number

    @IsDateString()
    @IsOptional()
    startedAt?: string

    @IsDateString()
    @IsNotEmpty()
    endsAt: string 
}
