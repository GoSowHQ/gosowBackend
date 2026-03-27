"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_response_type_1 = require("../common/types/service-response.type");
let WalletsService = class WalletsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWallet(userId) {
        const wallet = await this.prisma.wallet.create({
            data: {
                userId,
                accountNumber: this.generateAccountNumber(),
            },
        });
        return (0, service_response_type_1.createServiceResponse)(wallet, 'Wallet created successfully');
    }
    async getWalletByUserId(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found for this user');
        return (0, service_response_type_1.createServiceResponse)(wallet, 'Wallet retrieved successfully');
    }
    async getBalance(userId) {
        const res = await this.getWalletByUserId(userId);
        const wallet = res.data;
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        return (0, service_response_type_1.createServiceResponse)({ balance: wallet.balance, accountNumber: wallet.accountNumber }, 'Balance retrieved successfully');
    }
    generateAccountNumber() {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map