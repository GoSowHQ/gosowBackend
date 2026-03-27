import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { InterswitchService } from './interswitch.service';
import { LedgerService } from './ledger.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class PayoutsService {
    private prisma;
    private interswitchService;
    private ledgerService;
    constructor(prisma: PrismaService, interswitchService: InterswitchService, ledgerService: LedgerService);
    createBankAccount(userId: string, dto: CreateBankAccountDto): Promise<ServiceResponse>;
    listBankAccounts(userId: string): Promise<ServiceResponse>;
    getProjectBalance(userId: string, projectId: string): Promise<ServiceResponse>;
    requestPayout(userId: string, dto: RequestPayoutDto): Promise<ServiceResponse<{
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
    listPayouts(userId: string): Promise<ServiceResponse>;
}
