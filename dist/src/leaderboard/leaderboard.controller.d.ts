import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getProjectLeaderboard(projectId: string): Promise<import("../common/types/service-response.type").ServiceResponse<any>>;
}
