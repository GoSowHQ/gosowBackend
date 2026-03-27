import { PrismaService } from '../prisma/prisma.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class LeaderboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getProjectLeaderboard(projectId: string): Promise<ServiceResponse>;
}
