-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL,
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

