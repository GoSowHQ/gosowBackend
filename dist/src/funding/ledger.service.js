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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LedgerService = class LedgerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEntries(tx, entries) {
        if (!entries.length) {
            return;
        }
        await tx.ledgerEntry.createMany({
            data: entries.map((entry) => ({
                projectId: entry.projectId,
                paymentId: entry.paymentId,
                payoutRequestId: entry.payoutRequestId,
                type: entry.type,
                amountMinor: entry.amountMinor,
                currency: entry.currency || 'NGN',
                description: entry.description,
                metadata: entry.metadata,
            })),
        });
    }
    async getProjectAvailableBalanceMinor(projectId) {
        const aggregate = await this.prisma.ledgerEntry.aggregate({
            where: { projectId },
            _sum: { amountMinor: true },
        });
        return aggregate._sum.amountMinor || 0;
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map