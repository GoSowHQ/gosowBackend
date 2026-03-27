import { join } from 'path';

import type {
  BankAccountStatus as GeneratedBankAccountStatus,
  LedgerEntryType as GeneratedLedgerEntryType,
  PaymentChannel as GeneratedPaymentChannel,
  PaymentProvider as GeneratedPaymentProvider,
  PaymentStatus as GeneratedPaymentStatus,
  PayoutStatus as GeneratedPayoutStatus,
  Prisma as GeneratedPrisma,
  VirtualAccountStatus as GeneratedVirtualAccountStatus,
  WebhookEventStatus as GeneratedWebhookEventStatus,
} from '../../node_modules/.prisma/client';

type PrismaModule = typeof import('../../node_modules/.prisma/client');

const prismaClient = require(join(process.cwd(), 'node_modules/.prisma/client')) as PrismaModule;

export const PrismaClient: PrismaModule['PrismaClient'] = prismaClient.PrismaClient;
export const BankAccountStatus: PrismaModule['BankAccountStatus'] = prismaClient.BankAccountStatus;
export const LedgerEntryType: PrismaModule['LedgerEntryType'] = prismaClient.LedgerEntryType;
export const PaymentChannel: PrismaModule['PaymentChannel'] = prismaClient.PaymentChannel;
export const PaymentProvider: PrismaModule['PaymentProvider'] = prismaClient.PaymentProvider;
export const PaymentStatus: PrismaModule['PaymentStatus'] = prismaClient.PaymentStatus;
export const PayoutStatus: PrismaModule['PayoutStatus'] = prismaClient.PayoutStatus;
export const VirtualAccountStatus: PrismaModule['VirtualAccountStatus'] =
  prismaClient.VirtualAccountStatus;
export const WebhookEventStatus: PrismaModule['WebhookEventStatus'] =
  prismaClient.WebhookEventStatus;

export type BankAccountStatus = GeneratedBankAccountStatus;
export type InputJsonValue = GeneratedPrisma.InputJsonValue;
export type LedgerEntryType = GeneratedLedgerEntryType;
export type PaymentChannel = GeneratedPaymentChannel;
export type PaymentProvider = GeneratedPaymentProvider;
export type PaymentStatus = GeneratedPaymentStatus;
export type PayoutStatus = GeneratedPayoutStatus;
export type TransactionClient = GeneratedPrisma.TransactionClient;
export type VirtualAccountStatus = GeneratedVirtualAccountStatus;
export type WebhookEventStatus = GeneratedWebhookEventStatus;
