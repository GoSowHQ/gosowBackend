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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_response_type_1 = require("../common/types/service-response.type");
function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60);
}
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const page = params.page || 1;
        const limit = params.limit || 12;
        const where = { status: 'ACTIVE' };
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
        let orderBy = { createdAt: 'desc' };
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
        return (0, service_response_type_1.createServiceResponse)(data, 'Projects retrieved successfully', { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
    }
    async findBySlug(slug) {
        const project = await this.prisma.project.findUnique({
            where: { slug },
            include: {
                creator: { select: { id: true, name: true, avatarUrl: true } },
                rewards: true,
                _count: { select: { fundings: true, comments: true, bookmarks: true } },
            },
        });
        if (!project)
            throw new common_1.BadRequestException('Project not found');
        return (0, service_response_type_1.createServiceResponse)(project, 'Project retrieved successfully');
    }
    async create(userId, dto) {
        const baseSlug = slugify(dto.title || 'project');
        let slug = baseSlug;
        let i = 0;
        while (await this.prisma.project.findUnique({ where: { slug } })) {
            i += 1;
            slug = `${baseSlug}-${i}`;
            if (i > 10)
                break;
        }
        const project = await this.prisma.project.create({
            data: {
                title: dto.title,
                description: dto.description,
                shortDescription: dto.shortDescription,
                imageUrl: dto.imageUrl,
                category: (dto.category || 'OTHER'),
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
        return (0, service_response_type_1.createServiceResponse)(project, 'Project created successfully');
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map