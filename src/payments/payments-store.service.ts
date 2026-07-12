import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

import { MercadoPagoConfig, Order } from 'mercadopago';
import { v4 as uuid4 } from 'uuid';

import { Item } from '../common/interfaces/product.interface';
import { Payer } from './interfaces/payer.interface';

@Injectable()
export class PaymentsStoreService {
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
            });
        } catch (error) {
            throw new InternalServerErrorException('Error cancelling the order (MP)');
        }
    }
}
