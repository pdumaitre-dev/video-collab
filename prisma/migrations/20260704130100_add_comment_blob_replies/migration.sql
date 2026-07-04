-- AlterTable
ALTER TABLE "Comment_blob" ADD COLUMN "parentId" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_blob_parentId_idx" ON "Comment_blob"("parentId");

-- AddForeignKey
ALTER TABLE "Comment_blob"
ADD CONSTRAINT "Comment_blob_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Comment_blob"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
