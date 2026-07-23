-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'BAY';
ALTER TYPE "PaymentMethod" ADD VALUE 'TTB';
ALTER TYPE "PaymentMethod" ADD VALUE 'GSB';
ALTER TYPE "PaymentMethod" ADD VALUE 'BAAC';
ALTER TYPE "PaymentMethod" ADD VALUE 'CIMB';
ALTER TYPE "PaymentMethod" ADD VALUE 'UOB';
ALTER TYPE "PaymentMethod" ADD VALUE 'LH';
ALTER TYPE "PaymentMethod" ADD VALUE 'ICBC';
ALTER TYPE "PaymentMethod" ADD VALUE 'CITI';
