-- CreateEnum
CREATE TYPE "HouseholdSplitType" AS ENUM ('EQUAL', 'FULL');

-- CreateTable
CREATE TABLE "HouseholdExpense" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "description" TEXT NOT NULL,
    "category" TEXT,
    "spentAt" DATE NOT NULL,
    "splitType" "HouseholdSplitType" NOT NULL DEFAULT 'EQUAL',
    "receiptUrl" TEXT,
    "receiptKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdExpenseSplit" (
    "id" TEXT NOT NULL,
    "householdExpenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdSettlement" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HouseholdExpense_householdId_spentAt_idx" ON "HouseholdExpense"("householdId", "spentAt");

-- CreateIndex
CREATE INDEX "HouseholdExpense_paidById_idx" ON "HouseholdExpense"("paidById");

-- CreateIndex
CREATE INDEX "HouseholdExpenseSplit_userId_idx" ON "HouseholdExpenseSplit"("userId");

-- CreateIndex
CREATE INDEX "HouseholdExpenseSplit_householdExpenseId_idx" ON "HouseholdExpenseSplit"("householdExpenseId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdExpenseSplit_householdExpenseId_userId_key" ON "HouseholdExpenseSplit"("householdExpenseId", "userId");

-- CreateIndex
CREATE INDEX "HouseholdSettlement_householdId_settledAt_idx" ON "HouseholdSettlement"("householdId", "settledAt");

-- CreateIndex
CREATE INDEX "HouseholdSettlement_fromUserId_idx" ON "HouseholdSettlement"("fromUserId");

-- CreateIndex
CREATE INDEX "HouseholdSettlement_toUserId_idx" ON "HouseholdSettlement"("toUserId");

-- AddForeignKey
ALTER TABLE "HouseholdExpense" ADD CONSTRAINT "HouseholdExpense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdExpense" ADD CONSTRAINT "HouseholdExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdExpenseSplit" ADD CONSTRAINT "HouseholdExpenseSplit_householdExpenseId_fkey" FOREIGN KEY ("householdExpenseId") REFERENCES "HouseholdExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdExpenseSplit" ADD CONSTRAINT "HouseholdExpenseSplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdSettlement" ADD CONSTRAINT "HouseholdSettlement_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdSettlement" ADD CONSTRAINT "HouseholdSettlement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdSettlement" ADD CONSTRAINT "HouseholdSettlement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
