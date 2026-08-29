-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "pathname" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "seconds" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chapter_pathname_idx" ON "Chapter"("pathname");
