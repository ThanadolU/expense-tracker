-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'KTB', 'SCB', 'BBL', 'KBANK', 'PROMPTPAY', 'OTHER');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- CreateIndex
CREATE INDEX "Expense_userId_paymentMethod_idx" ON "Expense"("userId", "paymentMethod");
