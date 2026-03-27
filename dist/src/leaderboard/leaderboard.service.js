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
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_response_type_1 = require("../common/types/service-response.type");
let LeaderboardService = class LeaderboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProjectLeaderboard(projectId) {
        const fundings = await this.prisma.funding.findMany({
            where: { projectId, status: 'COMPLETED' },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { amount: 'desc' },
        });
        const userTotals = new Map();
        fundings.forEach((f) => {
            const existing = userTotals.get(f.userId);
            if (existing) {
                existing.totalAmount += Number(f.amount);
                existing.fundingCount += 1;
            }
            else {
                userTotals.set(f.userId, {
                    userId: f.userId,
                    name: f.isAnonymous ? 'Anonymous Backer' : f.user.name,
                    avatarUrl: f.isAnonymous ? null : f.user.avatarUrl,
                    totalAmount: Number(f.amount),
                    fundingCount: 1,
                    isAnonymous: f.isAnonymous,
                    lastFundingAt: f.createdAt,
                });
            }
        });
        const leaderboard = Array.from(userTotals.values())
            .sort((a, b) => b.totalAmount - a.totalAmount || a.lastFundingAt.getTime() - b.lastFundingAt.getTime())
            .map((entry, index) => ({
            rank: index + 1,
            ...entry,
            score: Math.floor(entry.totalAmount * 100),
            isTop3: index < 3,
        }));
        return (0, service_response_type_1.createServiceResponse)(leaderboard, 'Leaderboard retrieved successfully');
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map