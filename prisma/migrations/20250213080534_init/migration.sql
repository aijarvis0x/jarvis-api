-- CreateEnum
CREATE TYPE "OnChainStatus" AS ENUM ('pending', 'confirming', 'confirmed', 'reverted');

-- CreateEnum
CREATE TYPE "BotState" AS ENUM ('draft', 'pending', 'confirmed', 'waiting_generate', 'created');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('listed', 'cancelled', 'purchased');

-- CreateTable
CREATE TABLE "bots" (
    "id" BIGSERIAL NOT NULL,
    "nft_id" TEXT,
    "user_id" BIGINT NOT NULL,
    "agent_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner" TEXT NOT NULL,
    "avatar" TEXT,
    "background" TEXT,
    "name" TEXT,
    "nsfw" BOOLEAN,
    "tag" TEXT,
    "sub_tag" TEXT,
    "description" TEXT,
    "setting_mode" JSONB,
    "state" "BotState" NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_prompt_published" BOOLEAN NOT NULL DEFAULT false,
    "category_ids" JSONB,
    "lastest_price" BIGINT,
    "highest_price" BIGINT,
    "lowest_price" BIGINT,
    "count_conversation" BIGINT,
    "msg" TEXT,
    "signature" TEXT,
    "nonce" BIGINT,
    "fee" BIGINT,
    "expired_time" TIMESTAMP(3),
    "tx_hash" VARCHAR(66),
    "website" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "x" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastest_act" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "whatsapp" TEXT,
    "x" TEXT,
    "follower" BIGINT NOT NULL DEFAULT 0,
    "following" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" BIGSERIAL NOT NULL,
    "bot_id" BIGINT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "priority" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "tx_hash_delist" TEXT,
    "tx_hash_purchase" TEXT,
    "seller_id" BIGINT NOT NULL,
    "buyer_id" BIGINT,
    "seller_address" TEXT NOT NULL,
    "buyer_address" TEXT,
    "tag" TEXT NOT NULL,
    "sub_tag" TEXT,
    "nft_id" TEXT NOT NULL,
    "kiosk" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "fee" BIGINT,
    "currency" TEXT NOT NULL,
    "state" "OrderState" NOT NULL,
    "bot_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sold_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sui_transactions" (
    "id" BIGSERIAL NOT NULL,
    "status" "OnChainStatus" NOT NULL DEFAULT 'pending',
    "tx_hash" VARCHAR(66) NOT NULL,
    "sender" VARCHAR(199),
    "recipient" VARCHAR(199),
    "value" BIGINT,
    "move_call" VARCHAR(199),
    "event0" VARCHAR(199),
    "event1" VARCHAR(199),
    "events" JSONB,
    "logs" JSONB,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sui_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_bot" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "bot_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_bot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bots_agent_id_key" ON "bots"("agent_id");

-- CreateIndex
CREATE INDEX "bots_nft_id_idx" ON "bots"("nft_id");

-- CreateIndex
CREATE INDEX "bots_agent_id_idx" ON "bots"("agent_id");

-- CreateIndex
CREATE INDEX "bots_user_id_idx" ON "bots"("user_id");

-- CreateIndex
CREATE INDEX "bots_name_idx" ON "bots"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "users"("address");

-- CreateIndex
CREATE INDEX "users_address_idx" ON "users"("address");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_conversation_id_key" ON "conversations"("conversation_id");

-- CreateIndex
CREATE INDEX "orders_seller_id_idx" ON "orders"("seller_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_idx" ON "orders"("buyer_id");

-- CreateIndex
CREATE INDEX "orders_seller_address_idx" ON "orders"("seller_address");

-- CreateIndex
CREATE INDEX "orders_buyer_address_idx" ON "orders"("buyer_address");

-- CreateIndex
CREATE INDEX "orders_bot_id_idx" ON "orders"("bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tx_hash_key" ON "orders"("tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "sui_transactions_tx_hash_key" ON "sui_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "sui_transactions_status_idx" ON "sui_transactions"("status");

-- CreateIndex
CREATE INDEX "sui_transactions_sender_idx" ON "sui_transactions"("sender");

-- CreateIndex
CREATE INDEX "sui_transactions_recipient_idx" ON "sui_transactions"("recipient");

-- CreateIndex
CREATE INDEX "sui_transactions_tx_hash_idx" ON "sui_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "favorite_bot_user_id_idx" ON "favorite_bot"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_bot_user_id_bot_id_key" ON "favorite_bot"("user_id", "bot_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_bot" ADD CONSTRAINT "favorite_bot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_bot" ADD CONSTRAINT "favorite_bot_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
