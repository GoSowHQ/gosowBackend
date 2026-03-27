import { Injectable } from '@nestjs/common';
import {
  type InputJsonValue,
  LedgerEntryType,
  type TransactionClient,
} from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async createEntries(
    tx: TransactionClient,
    entries: Array<{
      projectId: string;
      paymentId?: string;
      payoutRequestId?: string;
      type: LedgerEntryType;
      amountMinor: number;
      currency?: string;
      description?: string;
      metadata?: InputJsonValue;
    }>,
  ) {
    if (!entries.length) {
      return;
    }

    await tx.ledgerEntry.createMany({
      data: entries.map((entry) => ({
        projectId: entry.projectId,
        paymentId: entry.paymentId,
        payoutRequestId: entry.payoutRequestId,
        type: entry.type,
        amountMinor: entry.amountMinor,
        currency: entry.currency || 'NGN',
        description: entry.description,
        metadata: entry.metadata,
      })),
    });
  }

  async getProjectAvailableBalanceMinor(projectId: string) {
    const aggregate = await this.prisma.ledgerEntry.aggregate({
      where: { projectId },
      _sum: { amountMinor: true },
    });

    return aggregate._sum.amountMinor || 0;
  }
}
