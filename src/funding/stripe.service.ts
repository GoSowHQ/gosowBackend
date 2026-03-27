import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class StripeService {
  public stripe: Stripe | null = null;

  constructor(private config: ConfigService) {
    const key = this.config.get('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, {
        apiVersion: '2024-12-18.acacia' as any,
      });
    }
  }

  async createCheckoutSession(params: {
    customerEmail: string;
    amount: number;
    projectTitle: string;
    rewardTitle?: string;
    fundingId: string;
    projectId: string;
    userId: string;
    projectSlug: string;
  }): Promise<ServiceResponse<Stripe.Checkout.Session>> {
    if (!this.stripe) throw new Error('Stripe is not configured');
    const frontendUrl = this.config.get('FRONTEND_URL');

    const session = await this.stripe.checkout.sessions.create({
      customer_email: params.customerEmail,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Back: ${params.projectTitle}`,
              description: params.rewardTitle || 'General backing',
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        fundingId: params.fundingId,
        projectId: params.projectId,
        userId: params.userId,
      },
      success_url: `${frontendUrl}/projects/${params.projectSlug}?funded=true`,
      cancel_url: `${frontendUrl}/projects/${params.projectSlug}?funded=cancelled`,
    });

    return createServiceResponse(session, 'Stripe checkout session created');
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) throw new Error('Stripe is not configured');
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
