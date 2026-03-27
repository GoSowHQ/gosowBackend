-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'INTERSWITCH');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'SETTLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "VirtualAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM (
  'PAYMENT_GROSS',
  'PROCESSOR_FEE',
  'PLATFORM_FEE',
  'PAYOUT_DEBIT',
  'PAYOUT_REVERSAL',
  'REFUND_DEBIT',
  'MANUAL_ADJUSTMENT'
);

-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "campaign_virtual_accounts" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'INTERSWITCH',
  "status" "VirtualAccountStatus" NOT NULL DEFAULT 'PENDING',
  "account_number" TEXT,
  "account_name" TEXT,
  "bank_code" TEXT,
  "bank_name" TEXT,
  "payable_code" TEXT,
  "external_reference" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "campaign_virtual_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "virtual_account_id" TEXT,
  "provider" "PaymentProvider" NOT NULL,
  "channel" "PaymentChannel" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount_minor" INTEGER NOT NULL,
  "processor_fee_minor" INTEGER NOT NULL DEFAULT 0,
  "platform_fee_minor" INTEGER NOT NULL DEFAULT 0,
  "net_amount_minor" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "provider_payment_id" TEXT,
  "provider_reference" TEXT,
  "merchant_reference" TEXT,
  "payer_name" TEXT,
  "payer_account_number" TEXT,
  "paid_at" TIMESTAMP(3),
  "settled_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
  "id" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "event_type" TEXT NOT NULL,
  "external_event_id" TEXT NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL,
  "error_message" TEXT,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "payment_id" TEXT,
  "payout_request_id" TEXT,
  "type" "LedgerEntryType" NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_bank_accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "bank_code" TEXT NOT NULL,
  "bank_name" TEXT NOT NULL,
  "account_number" TEXT NOT NULL,
  "account_name" TEXT NOT NULL,
  "status" "BankAccountStatus" NOT NULL DEFAULT 'PENDING',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "recipient_code" TEXT,
  "external_reference" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "creator_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "bank_account_id" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "fee_minor" INTEGER NOT NULL DEFAULT 0,
  "net_amount_minor" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "provider_reference" TEXT,
  "provider_payout_id" TEXT,
  "failure_reason" TEXT,
  "processed_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_virtual_accounts_project_id_key" ON "campaign_virtual_accounts"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_virtual_accounts_account_number_key" ON "campaign_virtual_accounts"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_virtual_accounts_external_reference_key" ON "campaign_virtual_accounts"("external_reference");

-- CreateIndex
CREATE INDEX "campaign_virtual_accounts_status_idx" ON "campaign_virtual_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_reference_key" ON "payments"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchant_reference_key" ON "payments"("merchant_reference");

-- CreateIndex
CREATE INDEX "payments_project_id_idx" ON "payments"("project_id");

-- CreateIndex
CREATE INDEX "payments_virtual_account_id_idx" ON "payments"("virtual_account_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_provider_idx" ON "payments"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_external_event_id_key" ON "webhook_events"("external_event_id");

-- CreateIndex
CREATE INDEX "webhook_events_provider_idx" ON "webhook_events"("provider");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "ledger_entries_project_id_idx" ON "ledger_entries"("project_id");

-- CreateIndex
CREATE INDEX "ledger_entries_payment_id_idx" ON "ledger_entries"("payment_id");

-- CreateIndex
CREATE INDEX "ledger_entries_payout_request_id_idx" ON "ledger_entries"("payout_request_id");

-- CreateIndex
CREATE INDEX "ledger_entries_type_idx" ON "ledger_entries"("type");

-- CreateIndex
CREATE UNIQUE INDEX "creator_bank_accounts_external_reference_key" ON "creator_bank_accounts"("external_reference");

-- CreateIndex
CREATE UNIQUE INDEX "creator_bank_accounts_user_id_account_number_bank_code_key"
ON "creator_bank_accounts"("user_id", "account_number", "bank_code");

-- CreateIndex
CREATE INDEX "creator_bank_accounts_user_id_idx" ON "creator_bank_accounts"("user_id");

-- CreateIndex
CREATE INDEX "creator_bank_accounts_status_idx" ON "creator_bank_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payout_requests_provider_reference_key" ON "payout_requests"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payout_requests_provider_payout_id_key" ON "payout_requests"("provider_payout_id");

-- CreateIndex
CREATE INDEX "payout_requests_user_id_idx" ON "payout_requests"("user_id");

-- CreateIndex
CREATE INDEX "payout_requests_project_id_idx" ON "payout_requests"("project_id");

-- CreateIndex
CREATE INDEX "payout_requests_bank_account_id_idx" ON "payout_requests"("bank_account_id");

-- CreateIndex
CREATE INDEX "payout_requests_status_idx" ON "payout_requests"("status");

-- AddForeignKey
ALTER TABLE "campaign_virtual_accounts"
ADD CONSTRAINT "campaign_virtual_accounts_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"
ADD CONSTRAINT "payments_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"
ADD CONSTRAINT "payments_virtual_account_id_fkey"
FOREIGN KEY ("virtual_account_id") REFERENCES "campaign_virtual_accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entries_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entries_payment_id_fkey"
FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_bank_accounts"
ADD CONSTRAINT "creator_bank_accounts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests"
ADD CONSTRAINT "payout_requests_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests"
ADD CONSTRAINT "payout_requests_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests"
ADD CONSTRAINT "payout_requests_bank_account_id_fkey"
FOREIGN KEY ("bank_account_id") REFERENCES "creator_bank_accounts"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries"
ADD CONSTRAINT "ledger_entries_payout_request_id_fkey"
FOREIGN KEY ("payout_request_id") REFERENCES "payout_requests"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
