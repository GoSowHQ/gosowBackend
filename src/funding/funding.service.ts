import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  LedgerEntryType,
  PaymentChannel,
  PaymentProvider,
  PaymentStatus,
  WebhookEventStatus,
} from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { LedgerService } from './ledger.service';
import { VirtualAccountsService } from './virtual-accounts.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class FundingService {
  private readonly logger = new Logger(FundingService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private ledgerService: LedgerService,
    private virtualAccountsService: VirtualAccountsService,
  ) {}

  async createCheckout(userId: string, userEmail: string, dto: CreateFundingDto): Promise<ServiceResponse> {
    this.logger.log(`Checkout initiated for project ${dto.projectId} by user ${userId} (amount: ${dto.amount})`);
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      this.logger.warn(`Project not found: ${dto.projectId}`);
      throw new NotFoundException('Project not found');
    }
    if (project.status !== 'ACTIVE') {
      this.logger.warn(`Project ${project.id} is not accepting funding (status: ${project.status})`);
      throw new BadRequestException('Project is not accepting funding');
    }
    if (project.endDate && new Date() > project.endDate) throw new BadRequestException('Project funding has ended');

    let rewardTitle: string | undefined;
    if (dto.rewardId) {
      const reward = await this.prisma.reward.findUnique({ where: { id: dto.rewardId } });
      if (!reward || reward.projectId !== dto.projectId) throw new BadRequestException('Invalid reward');
      if (dto.amount < Number(reward.amount)) throw new BadRequestException('Amount below reward minimum');
      if (reward.quantity && reward.claimed >= reward.quantity) throw new BadRequestException('Reward sold out');
      rewardTitle = reward.title;
    }

    const funding = await (this.prisma.funding as any).create({
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

      if (!resp) throw new BadRequestException('Failed to initiate Interswitch checkout');

      await this.prisma.funding.update({
        where: { id: funding.id },
        data: { stripePaymentId: resp.transactionReference },
      });

      this.logger.log(`Interswitch checkout URL generated for funding ${funding.id}`);
      return createServiceResponse({ url: resp.url }, 'Checkout initiated successfully');
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

    if (!session) throw new BadRequestException('Failed to initiate Stripe checkout');

    await this.prisma.funding.update({
      where: { id: funding.id },
      data: { stripePaymentId: session.id },
    });

    return createServiceResponse(
      { sessionId: session.id, url: session.url },
      'Checkout initiated successfully'
    );
  }

  async findByProject(projectId: string): Promise<ServiceResponse> {
    const fundings = await this.prisma.funding.findMany({
      where: { projectId, status: 'COMPLETED' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = (fundings as any[]).map((f) => {
      if (f.isAnonymous) {
        return {
          ...f,
          user: { id: f.user.id, name: 'Anonymous Backer', avatarUrl: null },
        };
      }
      return f;
    });

    return createServiceResponse(data, 'Project fundings retrieved successfully');
  }

  async handleCheckoutCompleted(sessionId: string, paymentIntentId: string) {
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
      // Re-fetch with a lock if possible, or at least check status again inside transaction
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

      // Check if project is now fully funded
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

  async handleCheckoutExpired(sessionId: string) {
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

  async handleInterswitchWebhook(payload: Record<string, any>) {
    this.logger.log(`Interswitch webhook received, event type: ${payload.event || payload.eventType || 'UNKNOWN'}`);
    const eventType = String(payload.event || payload.eventType || 'UNKNOWN');
    const externalEventId = String(
      payload.uuid ||
        payload.transactionReference ||
        payload.paymentReference ||
        payload.requestReference,
    );

    if (!externalEventId || externalEventId === 'undefined') {
      throw new BadRequestException('Webhook payload missing external event id');
    }

    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { externalEventId },
    });

    if (existingEvent?.status === WebhookEventStatus.PROCESSED) {
      return { duplicate: true };
    }

    const webhookEvent =
      existingEvent ||
      (await this.prisma.webhookEvent.create({
        data: {
          provider: PaymentProvider.INTERSWITCH,
          eventType,
          externalEventId,
          status: WebhookEventStatus.RECEIVED,
          payload: payload as any,
        },
      }));

    if (eventType !== 'TRANSACTION.COMPLETED') {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookEventStatus.IGNORED,
          processedAt: new Date(),
        },
      });
      return createServiceResponse({ ignored: true }, 'Webhook event ignored');
    }

    const accountNumber = String(
      payload.retrievalReferenceNumber ||
        payload.accountNumber ||
        payload.virtualAccountNumber ||
        '',
    );

    const virtualAccount =
      accountNumber &&
      (await this.virtualAccountsService.findByAccountNumber(accountNumber));

    if (!virtualAccount) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookEventStatus.FAILED,
          errorMessage: `Virtual account not found for ${accountNumber}`,
        },
      });
      throw new NotFoundException('Virtual account not found for webhook');
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

    const existingPayment =
      (providerReference &&
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
          status: WebhookEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });
      return createServiceResponse({ duplicate: true, paymentId: existingPayment.id }, 'Duplicate webhook event processed');
    }

    const grossAmountMinor = this.toMinor(
      payload.paymentAmount ?? payload.amount ?? payload.amountPaid,
    );
    const remittanceAmountMinor = this.toMinor(
      payload.remittanceAmount ?? payload.paymentAmount ?? payload.amount,
    );
    const processorFeeMinor = Math.max(0, grossAmountMinor - remittanceAmountMinor);
    const platformFeeMinor = this.calculatePlatformFee(grossAmountMinor);
    const netAmountMinor = Math.max(0, remittanceAmountMinor - platformFeeMinor);
    const paidAt = this.toDate(payload.paymentDate || payload.transactionDate);

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          projectId: virtualAccount.projectId,
          virtualAccountId: virtualAccount.id,
          provider: PaymentProvider.INTERSWITCH,
          channel: PaymentChannel.VIRTUAL_ACCOUNT,
          status: PaymentStatus.SETTLED,
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
          metadata: payload as any,
        },
      });

      await this.ledgerService.createEntries(tx, [
        {
          projectId: virtualAccount.projectId,
          paymentId: createdPayment.id,
          type: LedgerEntryType.PAYMENT_GROSS,
          amountMinor: grossAmountMinor,
          description: `Interswitch payment ${providerReference || createdPayment.id}`,
        },
        {
          projectId: virtualAccount.projectId,
          paymentId: createdPayment.id,
          type: LedgerEntryType.PROCESSOR_FEE,
          amountMinor: -processorFeeMinor,
          description: 'Interswitch processor fee',
        },
        {
          projectId: virtualAccount.projectId,
          paymentId: createdPayment.id,
          type: LedgerEntryType.PLATFORM_FEE,
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
          status: WebhookEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return createdPayment;
    });

    return createServiceResponse({ processed: true, paymentId: payment.id }, 'Webhook event processed successfully');
  }

  private calculatePlatformFee(amountMinor: number) {
    const percentage = Number(process.env.PLATFORM_FEE_PERCENTAGE || '5');
    return Math.round((amountMinor * percentage) / 100);
  }

  private toMinor(value: unknown) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid webhook amount');
    }

    return Math.round(amount * 100);
  }

  private toDate(value: unknown) {
    if (!value) {
      return null;
    }

    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
