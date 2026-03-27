import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsDto } from './dto/list-projects.dto';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: ListProjectsDto): Promise<ServiceResponse> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const where: any = { status: 'ACTIVE' };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { shortDescription: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      where.category = params.category;
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (params.sort) {
      case 'most_funded':
        orderBy = { currentAmount: 'desc' };
        break;
      case 'trending':
        orderBy = { backerCount: 'desc' };
        break;
      case 'ending_soon':
        orderBy = { endDate: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [total, data] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        include: { creator: { select: { id: true, name: true, avatarUrl: true } }, _count: { select: { fundings: true, comments: true, bookmarks: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return createServiceResponse(
      data,
      'Projects retrieved successfully',
      { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
    );
  }

  async findBySlug(slug: string): Promise<ServiceResponse> {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        rewards: true,
        _count: { select: { fundings: true, comments: true, bookmarks: true } },
      },
    });

    if (!project) throw new BadRequestException('Project not found');
    return createServiceResponse(project, 'Project retrieved successfully');
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ServiceResponse> {
    const baseSlug = slugify(dto.title || 'project');
    let slug = baseSlug;
    let i = 0;
    // ensure slug uniqueness
    while (await this.prisma.project.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${baseSlug}-${i}`;
      if (i > 10) break;
    }

    const project = await this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        imageUrl: dto.imageUrl,
        category: (dto.category || 'OTHER') as any,
        goalAmount: dto.goalAmount,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'PENDING',
        slug,
        creatorId: userId,
        rewards: dto.rewards ? {
          create: dto.rewards.map(r => ({
            title: r.title,
            amount: r.amount,
            description: r.description,
          }))
        } : undefined,
      },
      include: { rewards: true }
    });

    return createServiceResponse(project, 'Project created successfully');
  }
}
