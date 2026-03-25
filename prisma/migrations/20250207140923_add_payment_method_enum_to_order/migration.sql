/*
  Warnings:

  - You are about to drop the column `paymentMetho` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentMetho",
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'cod';
