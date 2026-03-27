import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { FundingService } from './funding.service';
import { CreateFundingDto } from './dto/create-funding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VirtualAccountsService } from './virtual-accounts.service';
import { PayoutsService } from './payouts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('funding')
export class FundingController {
  constructor(
    private fundingService: FundingService,
    private virtualAccountsService: VirtualAccountsService,
    private payoutsService: PayoutsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CreateFundingDto,
  ) {
    return this.fundingService.createCheckout(userId, email, dto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.fundingService.findByProject(projectId);
  }

  @Get('projects/:projectId/virtual-account')
  getProjectVirtualAccount(@Param('projectId') projectId: string) {
    return this.virtualAccountsService.getPublicProjectVirtualAccount(projectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('projects/:projectId/virtual-account/provision')
  provisionProjectVirtualAccount(@Param('projectId') projectId: string) {
    return this.virtualAccountsService.ensureProjectVirtualAccount(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/balance/me')
  getProjectBalance(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.payoutsService.getProjectBalance(userId, projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bank-accounts/me')
  createBankAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.payoutsService.createBankAccount(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bank-accounts/me')
  listBankAccounts(@CurrentUser('id') userId: string) {
    return this.payoutsService.listBankAccounts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payouts')
  requestPayout(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.payoutsService.requestPayout(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payouts/me')
  listPayouts(@CurrentUser('id') userId: string) {
    return this.payoutsService.listPayouts(userId);
  }
}
