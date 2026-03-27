import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string): Promise<ServiceResponse> {
    const comments = await this.prisma.comment.findMany({
      where: { projectId, parentId: null },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return createServiceResponse(comments, 'Comments retrieved successfully');
  }

  async create(userId: string, projectId: string, dto: CreateCommentDto): Promise<ServiceResponse> {
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        userId,
        projectId,
        parentId: dto.parentId,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return createServiceResponse(comment, 'Comment created successfully');
  }

  async update(userId: string, commentId: string, content: string): Promise<ServiceResponse> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('You can only update your own comments');

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
    return createServiceResponse(updated, 'Comment updated successfully');
  }

  async remove(userId: string, commentId: string, userRole: string): Promise<ServiceResponse> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Insufficient permissions');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return createServiceResponse(null, 'Comment removed successfully');
  }
}
