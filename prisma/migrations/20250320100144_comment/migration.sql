-- CreateTable
CREATE TABLE "comment_bot" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "bot_id" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_bot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "comment_bot" ADD CONSTRAINT "comment_bot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_bot" ADD CONSTRAINT "comment_bot_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
