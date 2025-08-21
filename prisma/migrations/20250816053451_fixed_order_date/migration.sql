-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "orderDate" DROP DEFAULT,
ALTER COLUMN "orderDate" SET DATA TYPE TEXT;
