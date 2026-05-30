import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator"
import { TransactionCustomerDto } from "./customer.dto"
import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"


export class CreateTransactionDto { // to be passed to midtrans 

    @IsString()
    @IsNotEmpty()
    orderId: string

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    subtotal: number

    @ApiProperty({ type: [TransactionCustomerDto] })
    @ValidateNested({ each: true })
    @Type(() => TransactionCustomerDto)
    customerDetails: TransactionCustomerDto
}
