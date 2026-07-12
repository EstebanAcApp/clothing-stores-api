import { Module } from '@nestjs/common';

import { PaymentsStoreService } from './payments-store.service';

import { ConfigService } from '@nestjs/config';

import { MercadoPagoConfig } from 'mercadopago';
import { PaymentsController } from './payments.controller';
import { PaymentsSaasService } from './payments-saas.service';
import { PaymentsWebhookService } from './payments-webhook.service';

@Module({
  providers: [
    {
      provide: 'MERCADOPAGO_STORE_CLIENT',
      useFactory: (config: ConfigService) => {
        const accessToken = config.get<string>('MERCADOPAGO_STORE_ACCESS_TOKEN');

        if (!accessToken) {
          throw new Error('The Mercado Pago access token was not found in the .env');
        }

        return new MercadoPagoConfig({
          accessToken,
          options: { timeout: 5000 },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'MERCADOPAGO_SAAS_CLIENT',
      useFactory: (config: ConfigService) => {
        const accessToken = config.get<string>('MERCADOPAGO_SAAS_ACCESS_TOKEN');

        if (!accessToken) {
          throw new Error('The Mercado Pago access token was not found in the .env');
        }

        return new MercadoPagoConfig({
          accessToken,
          options: { timeout: 5000 },
        });
      },
      inject: [ConfigService],
    },
    PaymentsStoreService,
    PaymentsSaasService,
    PaymentsWebhookService,
  ],
  exports: [
    'MERCADOPAGO_STORE_CLIENT', 
    'MERCADOPAGO_SAAS_CLIENT', 
    PaymentsStoreService,
    PaymentsSaasService,
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule { }
