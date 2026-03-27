import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateMe(userId: string, data: { name?: string; bio?: string }): Promise<ServiceResponse> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { name: data.name, bio: data.bio },
      select: { id: true, email: true, name: true, avatarUrl: true, bio: true, role: true, provider: true, emailVerified: true, isActive: true, createdAt: true, updatedAt: true },
    });
    return createServiceResponse(updated, 'User updated successfully');
  }

  async getUserProjects(userId: string): Promise<ServiceResponse> {
    const projects = await this.prisma.project.findMany({
      where: { creatorId: userId },
      include: { _count: { select: { fundings: true, comments: true, bookmarks: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return createServiceResponse(projects, 'User projects retrieved successfully');
  }
}
