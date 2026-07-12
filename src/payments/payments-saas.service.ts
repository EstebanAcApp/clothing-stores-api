import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MercadoPagoConfig, Order } from 'mercadopago';

import { Payer } from './interfaces/payer.interface';

@Injectable()
export class PaymentsSaasService {
    constructor(
        @Inject('MERCADOPAGO_SAAS_CLIENT') private readonly mp_client: InstanceType<typeof MercadoPagoConfig>,
        private readonly config: ConfigService,
    ) { }

    async createOrder(
        storeId: string,
        payer: Payer,
    ) {
        const order = new Order(this.mp_client);

        const saasPrice = this.config.get<string>('SAAS_PRICE');

        if (!saasPrice) {
            throw new Error('SaaS price not found in the .env');
        }

        try {
            const orderData = await order.create({
                body: {
                    type: 'online',
                    processing_mode: 'manual',
                    total_amount: saasPrice,
                    external_reference: storeId,
                    payer,
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
}
