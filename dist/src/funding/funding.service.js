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
var FundingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_service_1 = require("./stripe.service");
const ledger_service_1 = require("./ledger.service");
const virtual_accounts_service_1 = require("./virtual-accounts.service");
const service_response_type_1 = require("../common/types/service-response.type");
let FundingService = FundingService_1 = class FundingService {
    prisma;
    stripeService;
    ledgerService;
    virtualAccountsService;
    logger = new common_1.Logger(FundingService_1.name);
    constructor(prisma, stripeService, ledgerService, virtualAccountsService) {
        this.prisma = prisma;
        this.stripeService = stripeService;
        this.ledgerService = ledgerService;
        this.virtualAccountsService = virtualAccountsService;
    }
    async createCheckout(userId, userEmail, dto) {
        this.logger.log(`Checkout initiated for project ${dto.projectId} by user ${userId} (amount: ${dto.amount})`);
        const project = await this.prisma.project.findUnique({
            where: { id: dto.projectId },
        });
        if (!project) {
            this.logger.warn(`Project not found: ${dto.projectId}`);
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.status !== 'ACTIVE') {
            this.logger.warn(`Project ${project.id} is not accepting funding (status: ${project.status})`);
            throw new common_1.BadRequestException('Project is not accepting funding');
        }
        if (project.endDate && new Date() > project.endDate)
            throw new common_1.BadRequestException('Project funding has ended');
        let rewardTitle;
        if (dto.rewardId) {
            const reward = await this.prisma.reward.findUnique({ where: { id: dto.rewardId } });
            if (!reward || reward.projectId !== dto.projectId)
                throw new common_1.BadRequestException('Invalid reward');
            if (dto.amount < Number(reward.amount))
                throw new common_1.BadRequestException('Amount below reward minimum');
            if (reward.quantity && reward.claimed >= reward.quantity)
                throw new common_1.BadRequestException('Reward sold out');
            rewardTitle = reward.title;
        }
        const funding = await this.prisma.funding.create({
            data: {
                amount: dto.amount,
                userId,
                projectId: dto.projectId,
                rewardId: dto.rewardId,
                status: 'PENDING',
                isAnonymous: dto.isAnonymous || false,
            },
        });
        if (dto.provider === 'INTERSWITCH') {
            this.logger.log(`Creating Interswitch Webpay checkout for funding ${funding.id}`);
            const interswitchRes = await this.virtualAccountsService.getInterswitchService().createWebpayCheckout({
                amountMinor: dto.amount * 100,
                email: userEmail,
                fundingId: funding.id,
                projectSlug: project.slug,
                projectId: project.id,
            });
            const resp = interswitchRes.data;
            if (!resp)
                throw new common_1.BadRequestException('Failed to initiate Interswitch checkout');
            await this.prisma.funding.update({
                where: { id: funding.id },
                data: { stripePaymentId: resp.transactionReference },
            });
            this.logger.log(`Interswitch checkout URL generated for funding ${funding.id}`);
            return (0, service_response_type_1.createServiceResponse)({ url: resp.url }, 'Checkout initiated successfully');
        }
        this.logger.log(`Creating Stripe checkout session for funding ${funding.id}`);
        const stripeRes = await this.stripeService.createCheckoutSession({
            customerEmail: userEmail,
            amount: dto.amount,
            projectTitle: project.title,
            rewardTitle,
            fundingId: funding.id,
            projectId: project.id,
            userId,
            projectSlug: project.slug,
        });
        const session = stripeRes.data;
        if (!session)
            throw new common_1.BadRequestException('Failed to initiate Stripe checkout');
        await this.prisma.funding.update({
            where: { id: funding.id },
            data: { stripePaymentId: session.id },
        });
        return (0, service_response_type_1.createServiceResponse)({ sessionId: session.id, url: session.url }, 'Checkout initiated successfully');
    }
    async findByProject(projectId) {
        const fundings = await this.prisma.funding.findMany({
            where: { projectId, status: 'COMPLETED' },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const data = fundings.map((f) => {
            if (f.isAnonymous) {
                return {
                    ...f,
                    user: { id: f.user.id, name: 'Anonymous Backer', avatarUrl: null },
                };
            }
            return f;
        });
        return (0, service_response_type_1.createServiceResponse)(data, 'Project fundings retrieved successfully');
    }
    async handleCheckoutCompleted(sessionId, paymentIntentId) {
        this.logger.log(`Stripe checkout.session.completed received for session: ${sessionId}`);
        const funding = await this.prisma.funding.findUnique({
            where: { stripePaymentId: sessionId },
        });
        if (!funding) {
            this.logger.warn(`Funding record not found for session: ${sessionId}`);
            return;
        }
        if (funding.status === 'COMPLETED') {
            this.logger.log(`Funding ${funding.id} already completed. Skipping.`);
            return;
        }
        await this.prisma.$transaction(async (tx) => {
            const currentFunding = await tx.funding.findUnique({
                where: { id: funding.id },
            });
            if (!currentFunding || currentFunding.status === 'COMPLETED') {
                return;
            }
            await tx.funding.update({
                where: { id: funding.id },
                data: { status: 'COMPLETED', stripePaymentId: paymentIntentId },
            });
            await tx.project.update({
                where: { id: funding.projectId },
                data: {
                    currentAmount: { increment: funding.amount },
                    backerCount: { increment: 1 },
                },
            });
            if (funding.rewardId) {
                await tx.reward.update({
                    where: { id: funding.rewardId },
                    data: { claimed: { increment: 1 } },
                });
            }
            const project = await tx.project.findUnique({ where: { id: funding.projectId } });
            if (project && Number(project.currentAmount) >= Number(project.goalAmount)) {
                await tx.project.update({
                    where: { id: project.id },
                    data: { status: 'FUNDED' },
                });
            }
            this.logger.log(`Successfully processed funding ${funding.id} for project ${funding.projectId}`);
        });
    }
    async handleCheckoutExpired(sessionId) {
        this.logger.log(`Stripe checkout.session.expired for session: ${sessionId}`);
        const funding = await this.prisma.funding.findUnique({
            where: { stripePaymentId: sessionId },
        });
        if (!funding) {
            this.logger.warn(`No funding found for expired session: ${sessionId}`);
            return;
        }
        await this.prisma.funding.update({
            where: { id: funding.id },
            data: { status: 'FAILED' },
        });
        this.logger.log(`Funding ${funding.id} marked as FAILED due to expired session`);
    }
    async handleInterswitchWebhook(payload) {
        this.logger.log(`Interswitch webhook received, event type: ${payload.event || payload.eventType || 'UNKNOWN'}`);
        const eventType = String(payload.event || payload.eventType || 'UNKNOWN');
        const externalEventId = String(payload.uuid ||
            payload.transactionReference ||
            payload.paymentReference ||
            payload.requestReference);
        if (!externalEventId || externalEventId === 'undefined') {
            throw new common_1.BadRequestException('Webhook payload missing external event id');
        }
        const existingEvent = await this.prisma.webhookEvent.findUnique({
            where: { externalEventId },
        });
        if (existingEvent?.status === client_1.WebhookEventStatus.PROCESSED) {
            return { duplicate: true };
        }
        const webhookEvent = existingEvent ||
            (await this.prisma.webhookEvent.create({
                data: {
                    provider: client_1.PaymentProvider.INTERSWITCH,
                    eventType,
                    externalEventId,
                    status: client_1.WebhookEventStatus.RECEIVED,
                    payload: payload,
                },
            }));
        if (eventType !== 'TRANSACTION.COMPLETED') {
            await this.prisma.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: client_1.WebhookEventStatus.IGNORED,
                    processedAt: new Date(),
                },
            });
            return (0, service_response_type_1.createServiceResponse)({ ignored: true }, 'Webhook event ignored');
        }
        const accountNumber = String(payload.retrievalReferenceNumber ||
            payload.accountNumber ||
            payload.virtualAccountNumber ||
            '');
        const virtualAccount = accountNumber &&
            (await this.virtualAccountsService.findByAccountNumber(accountNumber));
        if (!virtualAccount) {
            await this.prisma.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: client_1.WebhookEventStatus.FAILED,
                    errorMessage: `Virtual account not found for ${accountNumber}`,
                },
            });
            throw new common_1.NotFoundException('Virtual account not found for webhook');
        }
        const providerReference = payload.transactionReference
            ? String(payload.transactionReference)
            : null;
        const providerPaymentId = payload.paymentReference
            ? String(payload.paymentReference)
            : providerReference;
        const merchantReference = payload.requestReference
            ? String(payload.requestReference)
            : null;
        const existingPayment = (providerReference &&
            (await this.prisma.payment.findUnique({
                where: { providerReference },
            }))) ||
            (providerPaymentId &&
                (await this.prisma.payment.findUnique({
                    where: { providerPaymentId },
                })));
        if (existingPayment) {
            await this.prisma.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: client_1.WebhookEventStatus.PROCESSED,
                    processedAt: new Date(),
                },
            });
            return (0, service_response_type_1.createServiceResponse)({ duplicate: true, paymentId: existingPayment.id }, 'Duplicate webhook event processed');
        }
        const grossAmountMinor = this.toMinor(payload.paymentAmount ?? payload.amount ?? payload.amountPaid);
        const remittanceAmountMinor = this.toMinor(payload.remittanceAmount ?? payload.paymentAmount ?? payload.amount);
        const processorFeeMinor = Math.max(0, grossAmountMinor - remittanceAmountMinor);
        const platformFeeMinor = this.calculatePlatformFee(grossAmountMinor);
        const netAmountMinor = Math.max(0, remittanceAmountMinor - platformFeeMinor);
        const paidAt = this.toDate(payload.paymentDate || payload.transactionDate);
        const payment = await this.prisma.$transaction(async (tx) => {
            const createdPayment = await tx.payment.create({
                data: {
                    projectId: virtualAccount.projectId,
                    virtualAccountId: virtualAccount.id,
                    provider: client_1.PaymentProvider.INTERSWITCH,
                    channel: client_1.PaymentChannel.VIRTUAL_ACCOUNT,
                    status: client_1.PaymentStatus.SETTLED,
                    amountMinor: grossAmountMinor,
                    processorFeeMinor,
                    platformFeeMinor,
                    netAmountMinor,
                    currency: String(payload.currency || 'NGN'),
                    providerPaymentId,
                    providerReference,
                    merchantReference,
                    payerName: payload.depositorName || payload.payerName || null,
                    payerAccountNumber: payload.sourceAccountNumber || null,
                    paidAt,
                    settledAt: paidAt || new Date(),
                    metadata: payload,
                },
            });
            await this.ledgerService.createEntries(tx, [
                {
                    projectId: virtualAccount.projectId,
                    paymentId: createdPayment.id,
                    type: client_1.LedgerEntryType.PAYMENT_GROSS,
                    amountMinor: grossAmountMinor,
                    description: `Interswitch payment ${providerReference || createdPayment.id}`,
                },
                {
                    projectId: virtualAccount.projectId,
                    paymentId: createdPayment.id,
                    type: client_1.LedgerEntryType.PROCESSOR_FEE,
                    amountMinor: -processorFeeMinor,
                    description: 'Interswitch processor fee',
                },
                {
                    projectId: virtualAccount.projectId,
                    paymentId: createdPayment.id,
                    type: client_1.LedgerEntryType.PLATFORM_FEE,
                    amountMinor: -platformFeeMinor,
                    description: 'Platform fee',
                },
            ]);
            await tx.project.update({
                where: { id: virtualAccount.projectId },
                data: {
                    currentAmount: { increment: grossAmountMinor / 100 },
                    backerCount: { increment: 1 },
                },
            });
            await tx.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: client_1.WebhookEventStatus.PROCESSED,
                    processedAt: new Date(),
                },
            });
            return createdPayment;
        });
        return (0, service_response_type_1.createServiceResponse)({ processed: true, paymentId: payment.id }, 'Webhook event processed successfully');
    }
    calculatePlatformFee(amountMinor) {
        const percentage = Number(process.env.PLATFORM_FEE_PERCENTAGE || '5');
        return Math.round((amountMinor * percentage) / 100);
    }
    toMinor(value) {
        const amount = Number(value || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Invalid webhook amount');
        }
        return Math.round(amount * 100);
    }
    toDate(value) {
        if (!value) {
            return null;
        }
        const date = new Date(String(value));
        return Number.isNaN(date.getTime()) ? null : date;
    }
};
exports.FundingService = FundingService;
exports.FundingService = FundingService = FundingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stripe_service_1.StripeService,
        ledger_service_1.LedgerService,
        virtual_accounts_service_1.VirtualAccountsService])
], FundingService);
//# sourceMappingURL=funding.service.js.map