import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { FundingModule } from '../funding/funding.module';

@Module({
  imports: [FundingModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
