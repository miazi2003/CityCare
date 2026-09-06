-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "assignedStaffId" TEXT;

-- CreateIndex
CREATE INDEX "complaints_assignedStaffId_idx" ON "complaints"("assignedStaffId");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
