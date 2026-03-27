import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentProvider, VirtualAccountStatus } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InterswitchService } from './interswitch.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class VirtualAccountsService {
  constructor(
    private prisma: PrismaService,
    private interswitchService: InterswitchService,
  ) {}

  async ensureProjectVirtualAccount(projectId: string): Promise<ServiceResponse> {
    const existing = await this.prisma.campaignVirtualAccount.findUnique({
      where: { projectId },
    });

    if (existing?.status === VirtualAccountStatus.ACTIVE && existing.accountNumber) {
      return createServiceResponse(existing, 'Virtual account already exists');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { creator: { select: { name: true } } },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Virtual account can only be provisioned for active projects',
      );
    }

    const interRes = await this.interswitchService.createVirtualAccount({
      projectId,
      projectTitle: project.title,
      creatorName: project.creator.name,
    });
    const provisioned = interRes.data;

    if (!provisioned) throw new BadRequestException('Failed to provision virtual account');

    const account = await this.prisma.campaignVirtualAccount.upsert({
      where: { projectId },
      update: {
        provider: PaymentProvider.INTERSWITCH,
        status: VirtualAccountStatus.ACTIVE,
        accountNumber: provisioned.accountNumber,
        accountName: provisioned.accountName,
        bankCode: provisioned.bankCode,
        bankName: provisioned.bankName,
        payableCode: provisioned.payableCode,
        externalReference: provisioned.externalReference,
        metadata: provisioned.metadata as any,
      },
      create: {
        projectId,
        provider: PaymentProvider.INTERSWITCH,
        status: VirtualAccountStatus.ACTIVE,
        accountNumber: provisioned.accountNumber,
        accountName: provisioned.accountName,
        bankCode: provisioned.bankCode,
        bankName: provisioned.bankName,
        payableCode: provisioned.payableCode,
        externalReference: provisioned.externalReference,
        metadata: provisioned.metadata as any,
      },
    });
    return createServiceResponse(account, 'Virtual account provisioned successfully');
  }

  async getPublicProjectVirtualAccount(projectId: string): Promise<ServiceResponse> {
    const account = await this.prisma.campaignVirtualAccount.findUnique({
      where: { projectId },
      select: {
        projectId: true,
        accountNumber: true,
        accountName: true,
        bankName: true,
        bankCode: true,
        payableCode: true,
        status: true,
      },
    });

    if (!account || account.status !== VirtualAccountStatus.ACTIVE) {
      throw new NotFoundException('Virtual account not found for project');
    }

    return createServiceResponse(account, 'Virtual account retrieved successfully');
  }

  async findByAccountNumber(accountNumber: string) {
    return this.prisma.campaignVirtualAccount.findUnique({
      where: { accountNumber },
      include: { project: true },
    });
  }

  getInterswitchService() {
    return this.interswitchService;
  }
}
