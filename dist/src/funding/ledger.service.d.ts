import { type InputJsonValue, LedgerEntryType, type TransactionClient } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class LedgerService {
    private prisma;
    constructor(prisma: PrismaService);
    createEntries(tx: TransactionClient, entries: Array<{
        projectId: string;
        paymentId?: string;
        payoutRequestId?: string;
        type: LedgerEntryType;
        amountMinor: number;
        currency?: string;
        description?: string;
        metadata?: InputJsonValue;
    }>): Promise<void>;
    getProjectAvailableBalanceMinor(projectId: string): Promise<number>;
}
