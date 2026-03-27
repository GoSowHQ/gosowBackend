import { FundingService } from './funding.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { VirtualAccountsService } from './virtual-accounts.service';
import { PayoutsService } from './payouts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
export declare class FundingController {
    private fundingService;
    private virtualAccountsService;
    private payoutsService;
    constructor(fundingService: FundingService, virtualAccountsService: VirtualAccountsService, payoutsService: PayoutsService);
    createCheckout(userId: string, email: string, dto: CreateFundingDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    findByProject(projectId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    getProjectVirtualAccount(projectId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    provisionProjectVirtualAccount(projectId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    getProjectBalance(userId: string, projectId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    createBankAccount(userId: string, dto: CreateBankAccountDto): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    listBankAccounts(userId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
    requestPayout(userId: string, dto: RequestPayoutDto): Promise<import("../common/types/service-response.type").ServiceResponse<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PayoutStatus;
        userId: string;
        projectId: string;
        currency: string;
        amountMinor: number;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        processedAt: Date | null;
        providerReference: string | null;
        netAmountMinor: number;
        bankAccountId: string;
        feeMinor: number;
        providerPayoutId: string | null;
        failureReason: string | null;
    }>>;
    listPayouts(userId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
