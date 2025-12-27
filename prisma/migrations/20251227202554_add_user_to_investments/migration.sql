-- AlterTable
ALTER TABLE "stock_investments" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "stock_investments" ADD CONSTRAINT "stock_investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
