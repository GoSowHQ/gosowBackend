import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class StripeService {
    private config;
    stripe: Stripe | null;
    constructor(config: ConfigService);
    createCheckoutSession(params: {
        customerEmail: string;
        amount: number;
        projectTitle: string;
        rewardTitle?: string;
        fundingId: string;
        projectId: string;
        userId: string;
        projectSlug: string;
    }): Promise<ServiceResponse<Stripe.Checkout.Session>>;
    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event;
}
