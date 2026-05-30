export class CreateTransactionDto {
    orderId: string
    amount: number
    customerDetails: CustomerDto
    items: any //??
}
