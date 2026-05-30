import { Queue, Worker } from "bullmq"
import { recordArticleView } from "@/api/v1/services/article.service"

const connection = {
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
}

export const articleViewQueue = new Queue("article-views", {
  connection,
})

new Worker(
  "article-views",
  async (job) => {
    const { articleId, userId } = job.data as {
      articleId: string
      userId?: string
    }

    await recordArticleView(articleId, userId)
  },
  {
    connection,
    concurrency: 5,
  }
)

articleViewQueue.on("error", (err) => {
  console.error("Article view queue error:", err)
})

export const initArticleViewWorker = () => {}
