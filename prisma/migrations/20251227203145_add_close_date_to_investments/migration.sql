-- AlterTable
ALTER TABLE "stock_investments" ADD COLUMN     "closeDate" TIMESTAMP(3),
ADD COLUMN     "closePrice" DECIMAL(65,30);
