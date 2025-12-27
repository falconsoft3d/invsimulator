-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiModelId" TEXT,
ADD COLUMN     "aiPrompt" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES "ai_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
