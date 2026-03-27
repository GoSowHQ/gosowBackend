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
exports.VirtualAccountsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const interswitch_service_1 = require("./interswitch.service");
const service_response_type_1 = require("../common/types/service-response.type");
let VirtualAccountsService = class VirtualAccountsService {
    prisma;
    interswitchService;
    constructor(prisma, interswitchService) {
        this.prisma = prisma;
        this.interswitchService = interswitchService;
    }
    async ensureProjectVirtualAccount(projectId) {
        const existing = await this.prisma.campaignVirtualAccount.findUnique({
            where: { projectId },
        });
        if (existing?.status === client_1.VirtualAccountStatus.ACTIVE && existing.accountNumber) {
            return (0, service_response_type_1.createServiceResponse)(existing, 'Virtual account already exists');
        }
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { creator: { select: { name: true } } },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Virtual account can only be provisioned for active projects');
        }
        const interRes = await this.interswitchService.createVirtualAccount({
            projectId,
            projectTitle: project.title,
            creatorName: project.creator.name,
        });
        const provisioned = interRes.data;
        if (!provisioned)
            throw new common_1.BadRequestException('Failed to provision virtual account');
        const account = await this.prisma.campaignVirtualAccount.upsert({
            where: { projectId },
            update: {
                provider: client_1.PaymentProvider.INTERSWITCH,
                status: client_1.VirtualAccountStatus.ACTIVE,
                accountNumber: provisioned.accountNumber,
                accountName: provisioned.accountName,
                bankCode: provisioned.bankCode,
                bankName: provisioned.bankName,
                payableCode: provisioned.payableCode,
                externalReference: provisioned.externalReference,
                metadata: provisioned.metadata,
            },
            create: {
                projectId,
                provider: client_1.PaymentProvider.INTERSWITCH,
                status: client_1.VirtualAccountStatus.ACTIVE,
                accountNumber: provisioned.accountNumber,
                accountName: provisioned.accountName,
                bankCode: provisioned.bankCode,
                bankName: provisioned.bankName,
                payableCode: provisioned.payableCode,
                externalReference: provisioned.externalReference,
                metadata: provisioned.metadata,
            },
        });
        return (0, service_response_type_1.createServiceResponse)(account, 'Virtual account provisioned successfully');
    }
    async getPublicProjectVirtualAccount(projectId) {
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
        if (!account || account.status !== client_1.VirtualAccountStatus.ACTIVE) {
            throw new common_1.NotFoundException('Virtual account not found for project');
        }
        return (0, service_response_type_1.createServiceResponse)(account, 'Virtual account retrieved successfully');
    }
    async findByAccountNumber(accountNumber) {
        return this.prisma.campaignVirtualAccount.findUnique({
            where: { accountNumber },
            include: { project: true },
        });
    }
    getInterswitchService() {
        return this.interswitchService;
    }
};
exports.VirtualAccountsService = VirtualAccountsService;
exports.VirtualAccountsService = VirtualAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        interswitch_service_1.InterswitchService])
], VirtualAccountsService);
//# sourceMappingURL=virtual-accounts.service.js.map