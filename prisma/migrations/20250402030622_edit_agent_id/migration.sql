-- AlterTable
ALTER TABLE "bots" ALTER COLUMN "agent_id" DROP NOT NULL,
ALTER COLUMN "agent_id" DROP DEFAULT,
ALTER COLUMN "agent_id" SET DATA TYPE TEXT;
