-- AlterTable
ALTER TABLE "category" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "usercategoryclick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usercategoryclick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usercategoryclick_userId_idx" ON "usercategoryclick"("userId");

-- CreateIndex
CREATE INDEX "usercategoryclick_categoryId_idx" ON "usercategoryclick"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "usercategoryclick_userId_categoryId_key" ON "usercategoryclick"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "usercategoryclick" ADD CONSTRAINT "usercategoryclick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usercategoryclick" ADD CONSTRAINT "usercategoryclick_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
