import { Module } from '@nestjs/common';
import { FundingController } from './funding.controller';
import { FundingService } from './funding.service';
import { StripeService } from './stripe.service';
import { InterswitchService } from './interswitch.service';
import { VirtualAccountsService } from './virtual-accounts.service';
import { LedgerService } from './ledger.service';
import { PayoutsService } from './payouts.service';

@Module({
  controllers: [FundingController],
  providers: [
    FundingService,
    StripeService,
    InterswitchService,
    VirtualAccountsService,
    LedgerService,
    PayoutsService,
  ],
  exports: [
    FundingService,
    StripeService,
    InterswitchService,
    VirtualAccountsService,
    LedgerService,
    PayoutsService,
  ],
})
export class FundingModule {}
