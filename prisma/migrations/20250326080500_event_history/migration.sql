-- CreateTable
CREATE TABLE "event_history" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "bot_id" BIGINT,
    "order_id" BIGINT,
    "event" JSONB,
    "event_type" TEXT NOT NULL,
    "from_address" TEXT,
    "to_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_history_pkey" PRIMARY KEY ("id")
);
