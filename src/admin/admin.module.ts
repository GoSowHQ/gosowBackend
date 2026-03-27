import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FundingModule } from '../funding/funding.module';

@Module({
  imports: [FundingModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
