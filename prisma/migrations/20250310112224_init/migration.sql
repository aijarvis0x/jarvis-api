-- DropIndex
DROP INDEX "transactions_tx_hash_key";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "log_index" BIGINT;
