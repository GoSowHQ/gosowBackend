import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { VirtualAccountsService } from '../funding/virtual-accounts.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private virtualAccountsService: VirtualAccountsService,
  ) {}

  async getDashboard(): Promise<ServiceResponse> {
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

    return createServiceResponse(
      {
        totalUsers,
        totalProjects,
        totalFundings: totalFunding._count,
        totalRaised: totalFunding._sum.amount || 0,
        totalEvents,
      },
      'Dashboard data retrieved successfully'
    );
  }

  async getPendingProjects(): Promise<ServiceResponse> {
    const projects = await this.prisma.project.findMany({
      where: { status: 'PENDING' },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return createServiceResponse(projects, 'Pending projects retrieved successfully');
  }

  async approveProject(projectId: string): Promise<ServiceResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ACTIVE' },
    });

    await this.virtualAccountsService.ensureProjectVirtualAccount(projectId);
    return createServiceResponse(updatedProject, 'Project approved successfully');
  }

  async rejectProject(projectId: string): Promise<ServiceResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'CANCELLED' },
    });
    return createServiceResponse(updated, 'Project rejected/cancelled successfully');
  }

  async getUsers(page = 1, limit = 20): Promise<ServiceResponse> {
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

    return createServiceResponse(
      users,
      'Users retrieved successfully',
      { total, page, limit, totalPages: Math.ceil(total / limit) }
    );
  }

  async updateUserRole(userId: string, role: UserRole): Promise<ServiceResponse> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return createServiceResponse(updated, 'User role updated successfully');
  }

  async toggleUserStatus(userId: string): Promise<ServiceResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
    return createServiceResponse(updated, `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  }
}
