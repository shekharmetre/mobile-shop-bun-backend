/*
  Warnings:

  - The `notes` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `CategoryInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionCounter` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "notes",
ADD COLUMN     "notes" JSONB,
ALTER COLUMN "totalPrice" DROP DEFAULT,
ALTER COLUMN "totalPrice" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."CategoryInfo";

-- DropTable
DROP TABLE "public"."TransactionCounter";
