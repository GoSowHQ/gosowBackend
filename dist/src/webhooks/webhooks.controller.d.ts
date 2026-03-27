import { StripeService } from '../funding/stripe.service';
import { FundingService } from '../funding/funding.service';
export declare class WebhooksController {
    private stripeService;
    private fundingService;
    constructor(stripeService: StripeService, fundingService: FundingService);
    handleStripeWebhook(req: any, signature: string): Promise<{
        received: boolean;
    }>;
    handleInterswitchWebhook(body: Record<string, any>): Promise<import("../common/types/service-response.type").ServiceResponse<{
        ignored: boolean;
    }> | import("../common/types/service-response.type").ServiceResponse<{
        duplicate: boolean;
        paymentId: string;
    }> | import("../common/types/service-response.type").ServiceResponse<{
        processed: boolean;
        paymentId: string;
    }> | {
        duplicate: boolean;
    }>;
}
