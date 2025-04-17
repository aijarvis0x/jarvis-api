-- CreateTable
CREATE TABLE "friends" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "friend_ids" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friends_user_id_key" ON "friends"("user_id");
