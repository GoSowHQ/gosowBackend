import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { LedgerService } from './ledger.service';
import { VirtualAccountsService } from './virtual-accounts.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class FundingService {
    private prisma;
    private stripeService;
    private ledgerService;
    private virtualAccountsService;
    private readonly logger;
    constructor(prisma: PrismaService, stripeService: StripeService, ledgerService: LedgerService, virtualAccountsService: VirtualAccountsService);
    createCheckout(userId: string, userEmail: string, dto: CreateFundingDto): Promise<ServiceResponse>;
    findByProject(projectId: string): Promise<ServiceResponse>;
    handleCheckoutCompleted(sessionId: string, paymentIntentId: string): Promise<void>;
    handleCheckoutExpired(sessionId: string): Promise<void>;
    handleInterswitchWebhook(payload: Record<string, any>): Promise<ServiceResponse<{
        ignored: boolean;
    }> | ServiceResponse<{
        duplicate: boolean;
        paymentId: string;
    }> | ServiceResponse<{
        processed: boolean;
        paymentId: string;
    }> | {
        duplicate: boolean;
    }>;
    private calculatePlatformFee;
    private toMinor;
    private toDate;
}
