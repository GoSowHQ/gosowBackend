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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_response_type_1 = require("../common/types/service-response.type");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateMe(userId, data) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { name: data.name, bio: data.bio },
            select: { id: true, email: true, name: true, avatarUrl: true, bio: true, role: true, provider: true, emailVerified: true, isActive: true, createdAt: true, updatedAt: true },
        });
        return (0, service_response_type_1.createServiceResponse)(updated, 'User updated successfully');
    }
    async getUserProjects(userId) {
        const projects = await this.prisma.project.findMany({
            where: { creatorId: userId },
            include: { _count: { select: { fundings: true, comments: true, bookmarks: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return (0, service_response_type_1.createServiceResponse)(projects, 'User projects retrieved successfully');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map