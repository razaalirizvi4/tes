-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMetho" TEXT NOT NULL DEFAULT 'cod',
ADD COLUMN     "specialInstructions" TEXT;
