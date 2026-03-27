import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BankAccountStatus,
  LedgerEntryType,
  PayoutStatus,
} from '../prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { InterswitchService } from './interswitch.service';
import { LedgerService } from './ledger.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private interswitchService: InterswitchService,
    private ledgerService: LedgerService,
  ) {}

  async createBankAccount(userId: string, dto: CreateBankAccountDto): Promise<ServiceResponse> {
    if (dto.isDefault) {
      await this.prisma.creatorBankAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const bankAccount = await this.prisma.creatorBankAccount.upsert({
      where: {
        userId_accountNumber_bankCode: {
          userId,
          accountNumber: dto.accountNumber,
          bankCode: dto.bankCode,
        },
      },
      update: {
        bankName: dto.bankName,
        accountName: dto.accountName,
        isDefault: dto.isDefault ?? false,
        status: BankAccountStatus.VERIFIED,
      },
      create: {
        userId,
        bankCode: dto.bankCode,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        isDefault: dto.isDefault ?? false,
        status: BankAccountStatus.VERIFIED,
        externalReference: `bank_${randomUUID()}`,
      },
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        isDefault: true,
        status: true,
      },
    });

    return createServiceResponse(bankAccount, 'Bank account created/updated successfully');
  }

  async listBankAccounts(userId: string): Promise<ServiceResponse> {
    const bankAccounts = await this.prisma.creatorBankAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        isDefault: true,
        status: true,
        createdAt: true,
      },
    });
    return createServiceResponse(bankAccounts, 'Bank accounts retrieved successfully');
  }

  async getProjectBalance(userId: string, projectId: string): Promise<ServiceResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, creatorId: true, title: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException('You do not own this project');
    }

    const availableBalanceMinor = await this.ledgerService.getProjectAvailableBalanceMinor(
      projectId,
    );

    return createServiceResponse(
      {
        projectId: project.id,
        title: project.title,
        currency: 'NGN',
        availableBalanceMinor,
      },
      'Project balance retrieved successfully'
    );
  }

  async requestPayout(userId: string, dto: RequestPayoutDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, creatorId: true, title: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.creatorId !== userId) {
      throw new ForbiddenException('You do not own this project');
    }

    const bankAccount = await this.prisma.creatorBankAccount.findFirst({
      where: {
        id: dto.bankAccountId,
        userId,
        status: BankAccountStatus.VERIFIED,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Verified bank account not found');
    }

    const availableBalanceMinor = await this.ledgerService.getProjectAvailableBalanceMinor(
      dto.projectId,
    );

    if (dto.amountMinor > availableBalanceMinor) {
      throw new BadRequestException('Requested amount exceeds available balance');
    }

    const providerReference = `po_${randomUUID()}`;
    const payoutRes = await this.interswitchService.createPayout({
      amountMinor: dto.amountMinor,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankCode: bankAccount.bankCode,
      narration: `Campaign payout for ${project.title}`,
      reference: providerReference,
    });
    const providerResult = payoutRes.data;
    if (!providerResult) throw new BadRequestException('Failed to initiate payout via provider');

    const payout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payoutRequest.create({
        data: {
          userId,
          projectId: dto.projectId,
          bankAccountId: dto.bankAccountId,
          amountMinor: dto.amountMinor,
          feeMinor: 0,
          netAmountMinor: dto.amountMinor,
          currency: 'NGN',
          status:
            providerResult.status === 'SUCCESSFUL'
              ? PayoutStatus.SUCCESSFUL
              : PayoutStatus.PROCESSING,
          providerReference: providerResult.providerReference,
          providerPayoutId: providerResult.providerPayoutId,
          processedAt:
            providerResult.status === 'SUCCESSFUL' ? new Date() : undefined,
          metadata: providerResult.metadata as any,
        },
      });

      await this.ledgerService.createEntries(tx, [
        {
          projectId: dto.projectId,
          payoutRequestId: created.id,
          type: LedgerEntryType.PAYOUT_DEBIT,
          amountMinor: -dto.amountMinor,
          description: `Payout request ${created.id}`,
          metadata: {
            bankAccountId: bankAccount.id,
            providerReference: providerResult.providerReference,
          } as any,
        },
      ]);

      return created;
    });

    return createServiceResponse(payout, 'Payout requested successfully');
  }

  async listPayouts(userId: string): Promise<ServiceResponse> {
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { userId },
      include: {
        project: { select: { id: true, title: true, slug: true } },
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            bankCode: true,
            accountName: true,
            accountNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return createServiceResponse(payouts, 'Payouts retrieved successfully');
  }
}
