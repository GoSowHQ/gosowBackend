import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) { }

  async createWallet(userId: string): Promise<ServiceResponse> {
    const wallet = await (this.prisma as any).wallet.create({
      data: {
        userId,
        accountNumber: this.generateAccountNumber(),
      },
    });
    return createServiceResponse(wallet, 'Wallet created successfully');
  }

  async getWalletByUserId(userId: string): Promise<ServiceResponse> {
    const wallet = await (this.prisma as any).wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found for this user');
    return createServiceResponse(wallet, 'Wallet retrieved successfully');
  }

  async getBalance(userId: string): Promise<ServiceResponse> {
    const res = await this.getWalletByUserId(userId);
    const wallet = res.data;
    if (!wallet) throw new NotFoundException('Wallet not found');

    return createServiceResponse(
      { balance: wallet.balance, accountNumber: wallet.accountNumber },
      'Balance retrieved successfully'
    );
  }

  generateAccountNumber(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
}
