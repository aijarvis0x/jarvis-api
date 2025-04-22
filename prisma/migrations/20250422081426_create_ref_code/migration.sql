-- CreateTable
CREATE TABLE "user_ref_code" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "ref_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ref_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_ref_code_ref_code_key" ON "user_ref_code"("ref_code");
