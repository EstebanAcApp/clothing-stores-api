import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

import { MercadoPagoConfig, Order } from 'mercadopago';
import { v4 as uuid4 } from 'uuid';

import { Item } from '../common/interfaces/product.interface';
import { Payer } from './interfaces/payer.interface';
import { ProcessOrderDto } from 'src/orders/dto/process-order.dto';

@Injectable()
export class PaymentsStoreService {
    private readonly logger = new Logger(PaymentsStoreService.name);

    constructor(
        @Inject('MERCADOPAGO_STORE_CLIENT') private readonly mp_client: InstanceType<typeof MercadoPagoConfig>,
    ) { }

    async getOrder(
        id: string,
    ) {
        const order = new Order(this.mp_client);

        try {
            return await order.get({ id });
        } catch (error) {
            throw new InternalServerErrorException('Error retrieving the order (MP)');
        }
    }

    async processOrder(
        orderId: string,
        orderAmount: number,
        dto: ProcessOrderDto,
    ) {
        const order = new Order(this.mp_client);

        console.log(dto);
        
        if (orderAmount !== dto.transaction_amount) {
            this.logger.warn(
                `Amount does not match for order ${orderId}: expected ${orderAmount}, received ${dto.transaction_amount}`,
            );
            throw new ConflictException('The amount does not match the order amount');
        }

        const currentOrder = await order.get({ id: orderId });

        if (currentOrder.transactions?.payments?.length) {
            this.logger.warn(`Order ${orderId} already has a transaction, returning existing state`);
            return {
                status: currentOrder.status,
                status_detail: currentOrder.status_detail,
                payment_status: currentOrder.transactions.payments[0]?.status,
                payment_status_detail: currentOrder.transactions.payments[0]?.status_detail,
            };
        }

        const transactionIdempotencyKey = `tx-${orderId}-${dto.token}`;
        const processIdempotencyKey = `process-${orderId}`;

        try {
            await order.createTransaction({
                id: orderId,
                body: {
                    payments: [
                        {
                            amount: String(dto.transaction_amount),
                            payment_method: {
                                id: dto.payment_method_id,
                                type: dto.payment_type,
                                token: dto.token,
                                installments: dto.installments,
                            }
                        }
                    ]
                },
                requestOptions: {
                    idempotencyKey: transactionIdempotencyKey,
                },
            })

            const result = await order.process({
                id: orderId,
                requestOptions: {
                    idempotencyKey: processIdempotencyKey,
                },
            });

            if (result.status === 'processed' && result.status_detail === 'accredited') {
                this.logger.log(
                    `Payment accredited for order ${orderId}`,
                );
            }

            if (result.status === 'failed' || result.status === 'canceled' || result.status === 'expired') {
                this.logger.warn(
                    `Payment rejected for order ${orderId}: ${JSON.stringify(result.status_detail)}`,
                );
            }

            return {
                status: result.status,
                status_detail: result.status_detail,
                payment_status: result.transactions?.payments?.[0]?.status,
                payment_status_detail: result.transactions?.payments?.[0]?.status_detail,
            };
        } catch (error: any) {
            if (error && typeof error === 'object' && error.data && error.data.id) {
                const failedOrder = error.data;
                const errorDetail = error.errors?.[0]?.details?.[0] ?? 'unknown';

                this.logger.warn(
                    `Payment rejected for order ${orderId} (${errorDetail}): ${JSON.stringify(
                        failedOrder.transactions?.payments?.[0]?.status_detail ?? failedOrder.status_detail,
                    )}`,
                );

                return {
                    status: failedOrder.status,
                    status_detail: failedOrder.status_detail,
                    payment_status: failedOrder.transactions?.payments?.[0]?.status,
                    payment_status_detail: failedOrder.transactions?.payments?.[0]?.status_detail,
                };
            }

            if (error && typeof error === 'object' && 'status' in error) {
                this.logger.error(
                    `MercadoPago API error [${error.status}] for order ${orderId}: ${JSON.stringify(error.cause ?? error)}`,
                );
                switch (error.status) {
                    case 400:
                        throw new BadRequestException('Invalid payment details');
                    case 404:
                        throw new NotFoundException('Order not found in MercadoPago');
                    case 409:
                        throw new ConflictException('Conflict processing the order');
                    default:
                        throw new InternalServerErrorException('Error processing payment with MercadoPago');
                }
            }

            this.logger.error(`Unexpected error processing order ${orderId}`, error);
            throw new InternalServerErrorException('Error processing the order');
        }
    }

    async createOrder(
        items: Item[],
        payer: Payer,
    ) {
        const order = new Order(this.mp_client);

        const total_amount = items
            .reduce((acc, item) => acc + (Number(item.unit_price) * item.quantity), 0)
            .toFixed(0);

        try {
            const orderData = await order.create({
                body: {
                    type: 'online',
                    processing_mode: 'manual',
                    total_amount,
                    external_reference: uuid4(),
                    payer,
                    items,
                },
                requestOptions: {
                    idempotencyKey: uuid4(),
                },
            });

            return {
                id: orderData.id,
                client_token: orderData.client_token,
                external_reference: orderData.external_reference,
            };
        } catch (error: any) {
            throw new InternalServerErrorException('Error creating the order (MP)');
        }
    }

    async cancelOrder(
        id: string,
    ) {
        const order = new Order(this.mp_client);

        try {
            await order.cancel({
                id,
                requestOptions: {
                    idempotencyKey: `cancel-${id}`,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error cancelling the order (MP)');
        }
    }

    async refundOrder(
        id: string,
    ) {
        const order = new Order(this.mp_client);

        const currentOrder = await order.get({ id });

        if (!currentOrder || !currentOrder.transactions?.payments) {
            throw new UnprocessableEntityException('Order has no associated payments to refund');
        }

        try {
            await order.refund({
                id,
                body: {
                    transactions: [
                        {
                            id: currentOrder.transactions.payments[0].id,
                            amount: currentOrder.transactions.payments[0].amount,
                        },
                    ]
                },
                requestOptions: {
                    idempotencyKey: `refund-${id}`,
                },
            })
        } catch (error) {
            throw new InternalServerErrorException('Error refunding the order (MP)');
        }
    }
}
