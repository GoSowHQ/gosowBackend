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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_response_type_1 = require("../common/types/service-response.type");
let CommentsService = class CommentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByProject(projectId) {
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
        return (0, service_response_type_1.createServiceResponse)(comments, 'Comments retrieved successfully');
    }
    async create(userId, projectId, dto) {
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
        return (0, service_response_type_1.createServiceResponse)(comment, 'Comment created successfully');
    }
    async update(userId, commentId, content) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        if (comment.userId !== userId)
            throw new common_1.ForbiddenException('You can only update your own comments');
        const updated = await this.prisma.comment.update({
            where: { id: commentId },
            data: { content },
        });
        return (0, service_response_type_1.createServiceResponse)(updated, 'Comment updated successfully');
    }
    async remove(userId, commentId, userRole) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        if (comment.userId !== userId && userRole !== 'ADMIN')
            throw new common_1.ForbiddenException('Insufficient permissions');
        await this.prisma.comment.delete({ where: { id: commentId } });
        return (0, service_response_type_1.createServiceResponse)(null, 'Comment removed successfully');
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map