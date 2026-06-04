import 'dotenv/config';
import { BadRequestException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ServiceResult } from '@/common/ServiceResult';
import { QrisNotificationDto } from './dto/notifications.dto';
import { MidtransService } from './midtrans.service';
import { OrderRepository } from '@/order/order.repository';
import crypto from 'crypto';
import { OrderStatus } from '@/generated/prisma';

@Injectable()
export class PaymentService {
    constructor(
        private readonly snap: MidtransService,
        private readonly orderRepository: OrderRepository,
    ) {
    }
    FRONTEND_URL = process.env.FRONTEND_URL!;
    SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
    // note: can only fit in transaction_details, customer_details does not work yet
    async createTransaction(dto: CreateTransactionDto): Promise<ServiceResult<any>> {
            const { orderId, subtotal, customerDetails, ...rest } = dto;
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
                        this.orderRepository.update(
                            { id: orderId },
                            { status: OrderStatus.PAYMENT_PAID }
                        );
                        // then decrement stock, increase totalSold
                    break;
                case 'settlement':
                    this.orderRepository.update(
                        { id: orderId },
                        { status: OrderStatus.PAYMENT_PAID }
                    );
                        // then decrement stock, increase totalSold
                    break;
                case 'cancel': case 'deny': case 'expire':
                    this.orderRepository.update(
                        { id: orderId },
                        { status: OrderStatus.PAYMENT_FAILED }
                    );
                    break;
                case 'pending':
                    this.orderRepository.update(
                        { id: orderId },
                        { status: OrderStatus.PAYMENT_PENDING }
                    );
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
