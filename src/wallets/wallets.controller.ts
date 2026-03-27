import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('me')
  async getMyWallet(@Request() req: any) {
    return this.walletsService.getBalance(req.user.id);
  }
}
