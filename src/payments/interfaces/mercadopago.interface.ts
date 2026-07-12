export interface MPWebhookData {
    id: string,
    status: 'created' | 'processed' | 'action_required',
    status_detail: 'accredited' | 'refunded' | 'partially_refunded' | 'card_insufficient_amount' | 'invalid_installments' | 'processing_error' | 'canceled' | string,
    total_paid_amount: number,
    transactions: any,
    type: 'point' | string,
    version: number,
    external_reference: string,
}

export interface MPWebhookBody {
    action: 'order.processed' | string,
    api_version: string,
    application_id: string,
    data: MPWebhookData,
    date_created: string,
    live_mode: boolean,
    type: string,
    user_id: number,
}