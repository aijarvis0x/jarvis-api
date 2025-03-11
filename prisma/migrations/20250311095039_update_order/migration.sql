/*
  Warnings:

  - The `sold_at` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "lastest_act" BIGINT,
DROP COLUMN "sold_at",
ADD COLUMN     "sold_at" BIGINT;
