import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('project/:projectId')
  async getProjectLeaderboard(@Param('projectId') projectId: string) {
    return this.leaderboardService.getProjectLeaderboard(projectId);
  }
}
