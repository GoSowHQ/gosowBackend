import { PrismaService } from '../prisma/prisma.service';
import { ServiceResponse } from '../common/types/service-response.type';
export declare class WalletsService {
    private prisma;
    constructor(prisma: PrismaService);
    createWallet(userId: string): Promise<ServiceResponse>;
    getWalletByUserId(userId: string): Promise<ServiceResponse>;
    getBalance(userId: string): Promise<ServiceResponse>;
    generateAccountNumber(): string;
}
