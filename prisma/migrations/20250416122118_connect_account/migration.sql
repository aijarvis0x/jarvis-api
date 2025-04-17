-- CreateTable
CREATE TABLE "discord_account" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "account_id" TEXT,
    "account_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_account" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "account_id" TEXT,
    "account_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x_account" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "account_id" TEXT,
    "account_info" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "x_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discord_account_account_id_key" ON "discord_account"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_account_account_id_key" ON "google_account"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "x_account_account_id_key" ON "x_account"("account_id");
