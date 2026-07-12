import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago';

import { PrismaService } from 'src/prisma/prisma.service';

import { MPWebhookBody } from './interfaces/mercadopago.interface';

@Injectable()
export class PaymentsWebhookService {
    private readonly logger = new Logger(PaymentsWebhookService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) { }

    async receiveMPWebhookStore(
        xSignature: string,
        xRequestId: string,
        dataId: string,
        body: MPWebhookBody,
    ) {
        const webhookSecret = this.config.get<string>('MERCADOPAGO_STORE_WEBHOOK_SECRET');
        await this.validateWebhook(webhookSecret, xSignature, xRequestId, dataId);

        try {
            switch (body.action) {
                case 'order.processed': {
                    const cancelledStatuses = ['card_insufficient_amount', 'invalid_installments', 'processing_error', 'canceled'];

                    if (body.data.status === 'processed' && body.data.status_detail === 'accredited') {
                        const order = await this.prisma.order.update({
                            where: { id: body.data.external_reference, paymentId: body.data.id },
                            data: { status: 'CONFIRMED' },
                            select: {
                                id: true,
                                items: {
                                    select: {
                                        productVariantId: true,
                                        quantity: true,
                                    },
                                },
                            },
                        });

                        this.logger.log(`Order ${order.id} confirmed`);

                        await this.prisma.$transaction(
                            order.items.map((item) =>
                                this.prisma.productVariant.update({
                                    where: { id: item.productVariantId },
                                    data: { stock: { decrement: item.quantity } },
                                }),
                            ),
                        );
                    } else if (body.data.status === 'processed' && cancelledStatuses.includes(body.data.status_detail)) {
                        await this.prisma.order.update({
                            where: { id: body.data.external_reference, paymentId: body.data.id },
                            data: { status: 'CANCELLED' },
                        });
                        this.logger.log(`Order ${body.data.id} cancelled`);
                    } else {
                        this.logger.log(`Order ${body.data.external_reference} not final: ${body.data.status}/${body.data.status_detail}`);
                    }
                    break;
                }
                default: {
                    this.logger.log(`Unhandled webhook action: ${body.action}`);
                }
            }
        } catch (error: any) {
            if (error.code === 'P2025') {
                this.logger.warn(`Order not found for id: ${body.data.external_reference}, forcing retry`);
                throw new InternalServerErrorException('Order not found yet, please retry');
            }
            this.prisma.handleError(error, 'Error updating the order');
        }
    }

    async receiveMPWebhookSaas(
        xSignature: string,
        xRequestId: string,
        dataId: string,
        body: MPWebhookBody,
    ) {
        const webhookSecret = this.config.get<string>('MERCADOPAGO_SAAS_WEBHOOK_SECRET');
        await this.validateWebhook(webhookSecret, xSignature, xRequestId, dataId);

        try {
            switch (body.action) {
                case 'order.processed': {
                    const cancelledStatuses = ['card_insufficient_amount', 'invalid_installments', 'processing_error', 'canceled'];

                    if (body.data.status === 'processed' && body.data.status_detail === 'accredited') {
                        const order = await this.prisma.order.update({
                            where: { id: body.data.external_reference, paymentId: body.data.id },
                            data: { status: 'CONFIRMED' },
                            select: {
                                id: true,
                                items: {
                                    select: {
                                        productVariantId: true,
                                        quantity: true,
                                    },
                                },
                            },
                        });

                        this.logger.log(`Order ${order.id} confirmed`);

                        await this.prisma.$transaction(
                            order.items.map((item) =>
                                this.prisma.productVariant.update({
                                    where: { id: item.productVariantId },
                                    data: { stock: { decrement: item.quantity } },
                                }),
                            ),
                        );
                    } else if (body.data.status === 'processed' && cancelledStatuses.includes(body.data.status_detail)) {
                        await this.prisma.order.update({
                            where: { id: body.data.external_reference, paymentId: body.data.id },
                            data: { status: 'CANCELLED' },
                        });
                        this.logger.log(`Order ${body.data.id} cancelled`);
                    } else {
                        this.logger.log(`Order ${body.data.external_reference} not final: ${body.data.status}/${body.data.status_detail}`);
                    }
                    break;
                }
                default: {
                    this.logger.log(`Unhandled webhook action: ${body.action}`);
                }
            }
        } catch (error: any) {
            if (error.code === 'P2025') {
                this.logger.warn(`Order not found for id: ${body.data.external_reference}, forcing retry`);
                throw new InternalServerErrorException('Order not found yet, please retry');
            }
            this.prisma.handleError(error, 'Error updating the order');
        }
    }

    private async validateWebhook(
        webhookSecret: string | undefined,
        xSignature: string,
        xRequestId: string,
        dataId: string,
    ) {
        if (!webhookSecret) {
            throw new Error('Mercado Pago webhook secret not defined in .env');
        }

        try {
            await WebhookSignatureValidator.validate({
                xSignature,
                xRequestId,
                dataId,
                secret: webhookSecret,
            });
            this.logger.log('Webhook validated');
        } catch (error) {
            this.logger.warn('Webhook invalid');
            if (error instanceof InvalidWebhookSignatureError) {
                throw new UnauthorizedException('Invalid webhook signature');
            }
            throw error;
        }
    }

}
