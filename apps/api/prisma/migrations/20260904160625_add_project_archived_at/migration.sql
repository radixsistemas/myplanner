-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "projects_archivedAt_idx" ON "projects"("archivedAt");
