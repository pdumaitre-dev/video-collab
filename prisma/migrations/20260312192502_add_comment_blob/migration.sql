-- CreateTable
CREATE TABLE "Comment_blob" (
    "id" SERIAL NOT NULL,
    "pathname" TEXT NOT NULL,
    "startSeconds" DOUBLE PRECISION NOT NULL,
    "endSeconds" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_blob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_blob_pathname_idx" ON "Comment_blob"("pathname");
