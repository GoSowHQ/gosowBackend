"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const interswitch_service_1 = require("./interswitch.service");
const ledger_service_1 = require("./ledger.service");
const service_response_type_1 = require("../common/types/service-response.type");
let PayoutsService = class PayoutsService {
    prisma;
    interswitchService;
    ledgerService;
    constructor(prisma, interswitchService, ledgerService) {
        this.prisma = prisma;
        this.interswitchService = interswitchService;
        this.ledgerService = ledgerService;
    }
    async createBankAccount(userId, dto) {
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
                status: client_1.BankAccountStatus.VERIFIED,
            },
            create: {
                userId,
                bankCode: dto.bankCode,
                bankName: dto.bankName,
                accountNumber: dto.accountNumber,
                accountName: dto.accountName,
                isDefault: dto.isDefault ?? false,
                status: client_1.BankAccountStatus.VERIFIED,
                externalReference: `bank_${(0, crypto_1.randomUUID)()}`,
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
        return (0, service_response_type_1.createServiceResponse)(bankAccount, 'Bank account created/updated successfully');
    }
    async listBankAccounts(userId) {
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
        return (0, service_response_type_1.createServiceResponse)(bankAccounts, 'Bank accounts retrieved successfully');
    }
    async getProjectBalance(userId, projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, creatorId: true, title: true },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.creatorId !== userId) {
            throw new common_1.ForbiddenException('You do not own this project');
        }
        const availableBalanceMinor = await this.ledgerService.getProjectAvailableBalanceMinor(projectId);
        return (0, service_response_type_1.createServiceResponse)({
            projectId: project.id,
            title: project.title,
            currency: 'NGN',
            availableBalanceMinor,
        }, 'Project balance retrieved successfully');
    }
    async requestPayout(userId, dto) {
        const project = await this.prisma.project.findUnique({
            where: { id: dto.projectId },
            select: { id: true, creatorId: true, title: true },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.creatorId !== userId) {
            throw new common_1.ForbiddenException('You do not own this project');
        }
        const bankAccount = await this.prisma.creatorBankAccount.findFirst({
            where: {
                id: dto.bankAccountId,
                userId,
                status: client_1.BankAccountStatus.VERIFIED,
            },
        });
        if (!bankAccount) {
            throw new common_1.NotFoundException('Verified bank account not found');
        }
        const availableBalanceMinor = await this.ledgerService.getProjectAvailableBalanceMinor(dto.projectId);
        if (dto.amountMinor > availableBalanceMinor) {
            throw new common_1.BadRequestException('Requested amount exceeds available balance');
        }
        const providerReference = `po_${(0, crypto_1.randomUUID)()}`;
        const payoutRes = await this.interswitchService.createPayout({
            amountMinor: dto.amountMinor,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName,
            bankCode: bankAccount.bankCode,
            narration: `Campaign payout for ${project.title}`,
            reference: providerReference,
        });
        const providerResult = payoutRes.data;
        if (!providerResult)
            throw new common_1.BadRequestException('Failed to initiate payout via provider');
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
                    status: providerResult.status === 'SUCCESSFUL'
                        ? client_1.PayoutStatus.SUCCESSFUL
                        : client_1.PayoutStatus.PROCESSING,
                    providerReference: providerResult.providerReference,
                    providerPayoutId: providerResult.providerPayoutId,
                    processedAt: providerResult.status === 'SUCCESSFUL' ? new Date() : undefined,
                    metadata: providerResult.metadata,
                },
            });
            await this.ledgerService.createEntries(tx, [
                {
                    projectId: dto.projectId,
                    payoutRequestId: created.id,
                    type: client_1.LedgerEntryType.PAYOUT_DEBIT,
                    amountMinor: -dto.amountMinor,
                    description: `Payout request ${created.id}`,
                    metadata: {
                        bankAccountId: bankAccount.id,
                        providerReference: providerResult.providerReference,
                    },
                },
            ]);
            return created;
        });
        return (0, service_response_type_1.createServiceResponse)(payout, 'Payout requested successfully');
    }
    async listPayouts(userId) {
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
        return (0, service_response_type_1.createServiceResponse)(payouts, 'Payouts retrieved successfully');
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        interswitch_service_1.InterswitchService,
        ledger_service_1.LedgerService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map