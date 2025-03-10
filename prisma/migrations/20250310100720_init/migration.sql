-- CreateTable
CREATE TABLE "mint_image_history" (
    "id" BIGSERIAL NOT NULL,
    "imageName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mint_image_history_pkey" PRIMARY KEY ("id")
);
