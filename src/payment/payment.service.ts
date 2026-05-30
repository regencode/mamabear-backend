import 'dotenv/config';
import { MidtransService } from '@/midtrans/midtrans.service';
import { BadRequestException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ServiceResult } from '@/common/ServiceResult';
import { QrisNotificationDto } from './dto/notifications.dto';
import crypto from 'crypto';

@Injectable()
export class PaymentService {
    constructor(
        private readonly snap: MidtransService,
    ) {
    }
    FRONTEND_URL = process.env.FRONTEND_URL!;
    SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
    // note: can only fit in transaction_details, customer_details does not work yet
    async createTransaction(dto: CreateTransactionDto): Promise<ServiceResult<any>>{
        try {
            const { orderId, subtotal, customerDetails } = dto;
            const transaction = await this.snap.createTransaction({
                transaction_details: {
                    order_id: orderId,
                    gross_amount: subtotal,
                },
                customer_details: customerDetails,
                callbacks: {
                    success: this.FRONTEND_URL + "/payment/success",
                    pending: this.FRONTEND_URL + "/payment/pending",
                    error: this.FRONTEND_URL + "/payment/error",
                }
            } as any);
            return {
                success: true,
                message: `Created new transaction for order ${orderId}`,
                data: transaction,
            }
        }
        catch (error) {
            throw new BadRequestException("Cannot create transaction: ", error);
        }
    }
    resolveNotificationType(paymentType: string) {
        if(paymentType == 'qris') return this.handleQris;
        else throw new UnprocessableEntityException(`Cannot process payment_type=${paymentType}: Unsupported.`);
    }

    async handleQris(notification: any): Promise<ServiceResult<null>> {
        try {
            notification = notification as QrisNotificationDto;
            const orderId = notification.order_id;
            const statusCode = notification.status_code;
            const grossAmount = notification.gross_amount;
            const signatureKey = notification.signature_key;
            const transactionStatus = notification.transaction_status;
            const fraudStatus = notification.fraud_status;

            const hash = crypto.createHash('sha512')
            .update(orderId + statusCode + grossAmount + this.SERVER_KEY)
            .digest('hex');
            if (hash !== signatureKey) {
                throw new UnauthorizedException("Signature key and hash does not match");
            }
            // TODO: wait for order repository
            switch (transactionStatus) {
                case 'capture':
                    if(fraudStatus == 'accept') 
                        // update order
                    break;
                case 'settlement':
                    break;

                case 'cancel':
                case 'deny':
                case 'expire':
                    break;

                case 'pending':
                    break;

                default:
                    throw new UnprocessableEntityException("Cannot process transaction with status: ", transactionStatus);
            }
            return {
                success: true,
                message: "ok",
                data: null,
            }
        }
        catch(error) {
            throw new UnprocessableEntityException("Cannot process notification in qris handler: ", error);
        }
    }
}
