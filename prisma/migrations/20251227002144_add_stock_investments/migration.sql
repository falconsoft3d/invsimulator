-- CreateTable
CREATE TABLE "stock_investments" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shares" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "buyPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalInvested" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitLoss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitLossPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "buyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'activa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_investments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stock_investments" ADD CONSTRAINT "stock_investments_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
