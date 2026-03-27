import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getProjectLeaderboard(projectId: string): Promise<ServiceResponse> {
    const fundings = await this.prisma.funding.findMany({
      where: { projectId, status: 'COMPLETED' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { amount: 'desc' },
    });

    // Group by user to show total contribution
    const userTotals = new Map<string, any>();

    fundings.forEach((f: any) => {
      const existing = userTotals.get(f.userId);
      if (existing) {
        existing.totalAmount += Number(f.amount);
        existing.fundingCount += 1;
      } else {
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
        score: Math.floor(entry.totalAmount * 100), // Kahoot-style score
        isTop3: index < 3,
      }));

    return createServiceResponse(leaderboard, 'Leaderboard retrieved successfully');
  }
}
