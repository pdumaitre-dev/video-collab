-- CreateTable
CREATE TABLE "Chapter_blob" (
    "id" SERIAL NOT NULL,
    "pathname" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "seconds" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_blob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chapter_blob_pathname_idx" ON "Chapter_blob"("pathname");

-- CreateIndex
CREATE INDEX "Chapter_blob_pathname_seconds_idx" ON "Chapter_blob"("pathname", "seconds");
