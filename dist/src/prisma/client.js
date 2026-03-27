"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEventStatus = exports.VirtualAccountStatus = exports.PayoutStatus = exports.PaymentStatus = exports.PaymentProvider = exports.PaymentChannel = exports.LedgerEntryType = exports.BankAccountStatus = exports.PrismaClient = void 0;
const path_1 = require("path");
const prismaClient = require((0, path_1.join)(process.cwd(), 'node_modules/.prisma/client'));
exports.PrismaClient = prismaClient.PrismaClient;
exports.BankAccountStatus = prismaClient.BankAccountStatus;
exports.LedgerEntryType = prismaClient.LedgerEntryType;
exports.PaymentChannel = prismaClient.PaymentChannel;
exports.PaymentProvider = prismaClient.PaymentProvider;
exports.PaymentStatus = prismaClient.PaymentStatus;
exports.PayoutStatus = prismaClient.PayoutStatus;
exports.VirtualAccountStatus = prismaClient.VirtualAccountStatus;
exports.WebhookEventStatus = prismaClient.WebhookEventStatus;
//# sourceMappingURL=client.js.map