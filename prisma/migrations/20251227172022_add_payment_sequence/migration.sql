/*
  Warnings:

  - A unique constraint covering the columns `[sequence]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sequence` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add column as nullable first
ALTER TABLE "payments" ADD COLUMN "sequence" TEXT;

-- Update existing records with generated sequences
DO $$
DECLARE
    rec RECORD;
    entrada_counter INTEGER := 0;
    salida_counter INTEGER := 0;
BEGIN
    FOR rec IN SELECT id, type FROM "payments" ORDER BY "createdAt" ASC
    LOOP
        IF rec.type = 'Entrada' THEN
            entrada_counter := entrada_counter + 1;
            UPDATE "payments" 
            SET "sequence" = 'IN' || LPAD(entrada_counter::TEXT, 4, '0')
            WHERE id = rec.id;
        ELSE
            salida_counter := salida_counter + 1;
            UPDATE "payments" 
            SET "sequence" = 'OUT' || LPAD(salida_counter::TEXT, 4, '0')
            WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;

-- Make column NOT NULL after populating
ALTER TABLE "payments" ALTER COLUMN "sequence" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_sequence_key" ON "payments"("sequence");
