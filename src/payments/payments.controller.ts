import { Controller, Headers, Post, Query, Req } from '@nestjs/common';
import { type Request } from 'express';

import { PaymentsWebhookService } from './payments-webhook.service';

import { Public } from 'src/auth/decorators/public.decorator';

@Controller('payments/webhooks')
export class PaymentsController {
    constructor(
        private readonly paymentsWebhookService: PaymentsWebhookService,
    ) { }

    @Public()
    @Post('store')
    async receiveMPWebhookStore(
        @Headers('x-signature') xSignature: string,
        @Headers('x-request-id') xRequestId: string,
        @Query('data.id') dataId: string,
        @Req() req: Request,
    ) {
        return this.paymentsWebhookService.receiveMPWebhookStore(
            xSignature,
            xRequestId,
            dataId,
            req.body,
        );
    }

    @Public()
    @Post('saas')
    async receiveMPWebhookSaas(
        @Headers('x-signature') xSignature: string,
        @Headers('x-request-id') xRequestId: string,
        @Query('data.id') dataId: string,
        @Req() req: Request,
    ) {
        return this.paymentsWebhookService.receiveMPWebhookSaas(
            xSignature,
            xRequestId,
            dataId,
            req.body,
        );
    }
}
