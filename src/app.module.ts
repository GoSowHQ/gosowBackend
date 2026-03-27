import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { RewardsModule } from './rewards/rewards.module';
import { FundingModule } from './funding/funding.module';
import { CommentsModule } from './comments/comments.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    RewardsModule,
    FundingModule,
    CommentsModule,
    EventsModule,
    AdminModule,
    WebhooksModule,
    LeaderboardModule,
    WalletsModule,
  ],
})
export class AppModule {}
