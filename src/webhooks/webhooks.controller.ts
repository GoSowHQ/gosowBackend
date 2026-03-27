import { Controller, Post, Req, Headers, BadRequestException, Body } from '@nestjs/common';
import { StripeService } from '../funding/stripe.service';
import { FundingService } from '../funding/funding.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private stripeService: StripeService,
    private fundingService: FundingService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    let event;
    try {
      event = this.stripeService.constructWebhookEvent(
        req.rawBody as Buffer,
        signature,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await this.fundingService.handleCheckoutCompleted(
          session.id,
          session.payment_intent,
        );
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as any;
        await this.fundingService.handleCheckoutExpired(session.id);
        break;
      }
    }

    return { received: true };
  }

  @Post('interswitch')
  async handleInterswitchWebhook(@Body() body: Record<string, any>) {
    return this.fundingService.handleInterswitchWebhook(body);
  }
}
