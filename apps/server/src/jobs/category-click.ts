import { Queue, Worker } from "bullmq"
import { incrementUserCategoryClick } from "@/api/v1/services/category.service"

const connection = {
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
}

export const categoryClickQueue = new Queue("category-clicks", {
  connection,
})

new Worker(
  "category-clicks",
  async (job) => {
    const { userId, categoryId } = job.data as {
      userId: string
      categoryId: string
    }

    await incrementUserCategoryClick(userId, categoryId)
  },
  {
    connection,
    concurrency: 5,
  }
)

categoryClickQueue.on("error", (err) => {
  console.error("Queue error:", err)
})

export const initCategoryClickWorker = () => {}
