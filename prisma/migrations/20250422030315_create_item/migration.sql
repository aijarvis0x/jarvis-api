-- CreateTable
CREATE TABLE "items" (
    "id" BIGSERIAL NOT NULL,
    "nft_id" TEXT,
    "user_id" BIGINT,
    "owner" TEXT,
    "img" TEXT,
    "name" TEXT,
    "nsfw" BOOLEAN,
    "tag" TEXT,
    "sub_tag" TEXT,
    "description" TEXT,
    "attributes" JSONB,
    "setting_mode" JSONB,
    "state" TEXT,
    "is_published" BOOLEAN DEFAULT false,
    "is_prompt_published" BOOLEAN DEFAULT false,
    "category_ids" JSONB,
    "lastest_price" BIGINT,
    "highest_price" BIGINT,
    "lowest_price" BIGINT,
    "count_conversation" BIGINT,
    "fee" TEXT,
    "expired_time" TIMESTAMP(3),
    "tx_hash" VARCHAR(66),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastest_act" BIGINT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_nft_id_key" ON "items"("nft_id");
