-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
