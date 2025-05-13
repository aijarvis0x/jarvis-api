-- CreateTable
CREATE TABLE "mint_fragment_history" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "round_id" TEXT,
    "signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mint_fragment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mint_fragment_history_user_id_round_id_key" ON "mint_fragment_history"("user_id", "round_id");
