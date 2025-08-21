/*
  Warnings:

  - You are about to drop the column `amount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderKey` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `productInfo` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."OrderCategory" AS ENUM ('mobile_accessory', 'repair');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('advanced', 'full_payment', 'cash_on_delivery');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('success', 'failed', 'processing');

-- CreateEnum
CREATE TYPE "public"."DeliveryType" AS ENUM ('in_shop', 'home_delivery');

-- CreateEnum
CREATE TYPE "public"."OrderFlowStatus" AS ENUM ('in_progress', 'shipping_soon', 'out_for_delivery', 'completed', 'cancelled');

-- DropIndex
DROP INDEX "public"."Order_orderKey_idx";

-- DropIndex
DROP INDEX "public"."Order_orderKey_userId_key";

-- DropIndex
DROP INDEX "public"."Order_userId_idx";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "amount",
DROP COLUMN "orderKey",
DROP COLUMN "productInfo",
DROP COLUMN "status",
ADD COLUMN     "authId" TEXT,
ADD COLUMN     "category" "public"."OrderCategory" NOT NULL DEFAULT 'mobile_accessory',
ADD COLUMN     "delivery" "public"."DeliveryType" NOT NULL DEFAULT 'in_shop',
ADD COLUMN     "device" JSONB,
ADD COLUMN     "items" JSONB,
ADD COLUMN     "location" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderFlow" "public"."OrderFlowStatus" NOT NULL DEFAULT 'in_progress',
ADD COLUMN     "payment" "public"."PaymentStatus" NOT NULL DEFAULT 'cash_on_delivery',
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "txnStatus" "public"."TransactionStatus" NOT NULL DEFAULT 'processing',
ALTER COLUMN "txnId" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."OrderStatus";
