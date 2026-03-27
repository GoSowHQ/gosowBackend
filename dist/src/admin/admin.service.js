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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const virtual_accounts_service_1 = require("../funding/virtual-accounts.service");
const service_response_type_1 = require("../common/types/service-response.type");
let AdminService = class AdminService {
    prisma;
    virtualAccountsService;
    constructor(prisma, virtualAccountsService) {
        this.prisma = prisma;
        this.virtualAccountsService = virtualAccountsService;
    }
    async getDashboard() {
        const [totalUsers, totalProjects, totalFunding, totalEvents] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.project.count(),
            this.prisma.funding.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.event.count(),
        ]);
        return (0, service_response_type_1.createServiceResponse)({
            totalUsers,
            totalProjects,
            totalFundings: totalFunding._count,
            totalRaised: totalFunding._sum.amount || 0,
            totalEvents,
        }, 'Dashboard data retrieved successfully');
    }
    async getPendingProjects() {
        const projects = await this.prisma.project.findMany({
            where: { status: 'PENDING' },
            include: {
                creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        return (0, service_response_type_1.createServiceResponse)(projects, 'Pending projects retrieved successfully');
    }
    async approveProject(projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const updatedProject = await this.prisma.project.update({
            where: { id: projectId },
            data: { status: 'ACTIVE' },
        });
        await this.virtualAccountsService.ensureProjectVirtualAccount(projectId);
        return (0, service_response_type_1.createServiceResponse)(updatedProject, 'Project approved successfully');
    }
    async rejectProject(projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const updated = await this.prisma.project.update({
            where: { id: projectId },
            data: { status: 'CANCELLED' },
        });
        return (0, service_response_type_1.createServiceResponse)(updated, 'Project rejected/cancelled successfully');
    }
    async getUsers(page = 1, limit = 20) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, email: true, name: true, role: true, isActive: true,
                    provider: true, createdAt: true,
                    _count: { select: { projects: true, fundings: true } },
                },
            }),
            this.prisma.user.count(),
        ]);
        return (0, service_response_type_1.createServiceResponse)(users, 'Users retrieved successfully', { total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    async updateUserRole(userId, role) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        return (0, service_response_type_1.createServiceResponse)(updated, 'User role updated successfully');
    }
    async toggleUserStatus(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
        });
        return (0, service_response_type_1.createServiceResponse)(updated, `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        virtual_accounts_service_1.VirtualAccountsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map