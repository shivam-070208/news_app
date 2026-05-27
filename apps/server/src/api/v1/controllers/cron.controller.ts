import { Request, Response } from "express"
import { db, EmailFrequency } from "@workspace/db"
import { sendNewsEmail, type ArticlePreview } from "@workspace/email"
import { ApiErrors, sendSuccess } from "@/lib/api-response"

// ─── Helpers ────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 20 // number of emails to dispatch concurrently

/**
 * Splits an array into chunks of the given size.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Returns a Date that is `hours` hours before now.
 */
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

// ─── Controller ──────────────────────────────────────────────────────────────

export class CronController {
  /**
   * POST /api/v1/cron/send-newsletters?frequency=DAILY|WEEKLY
   *
   * Secured by a Bearer token matching CRON_SECRET env var.
   * Should be triggered externally by a cron scheduler (Vercel Cron, GitHub Actions, etc.)
   *
   * Strategy:
   *  1. Only targets users matching the requested `frequency`.
   *  2. Filters articles published within the relevant time window (24h for DAILY, 7d for WEEKLY).
   *  3. Batches DB article queries by unique category sets (eliminates N+1).
   *  4. Dispatches emails concurrently in chunks (avoids sequential bottleneck).
   *  5. Falls back to top-5 global news if a user has no categories selected.
   */
  public async sendNewsletters(req: Request, res: Response) {
    try {
      // ── Auth ──────────────────────────────────────────────────────────────
      const authHeader = req.headers.authorization
      if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return ApiErrors.unauthorized(res)
      }

      // ── Validate frequency param ──────────────────────────────────────────
      const frequency = (
        req.query.frequency as string
      )?.toUpperCase() as EmailFrequency
      if (!frequency || !Object.values(EmailFrequency).includes(frequency)) {
        return ApiErrors.validation(
          res,
          "Query param `frequency` must be either DAILY or WEEKLY"
        )
      }

      // ── Ensure FRONTEND_URL is configured ─────────────────────────────────
      const frontendUrl = process.env.FRONTEND_URL
      if (!frontendUrl) {
        console.error(
          "[cron] FRONTEND_URL env var is not set — aborting to avoid broken links"
        )
        return ApiErrors.internal(res)
      }

      // ── Time window for article freshness ────────────────────────────────
      const publishedSince =
        frequency === "DAILY" ? hoursAgo(24) : hoursAgo(24 * 7)

      // ── Fetch opted-in users matching this frequency ──────────────────────
      const preferences = await db.userPreference.findMany({
        where: {
          receiveEmails: true,
          emailFrequency: frequency,
        },
        include: {
          user: {
            select: { email: true },
          },
        },
      })

      if (preferences.length === 0) {
        return sendSuccess(res, {
          message: `No users opted in for ${frequency} emails`,
          emailsSent: 0,
        })
      }

      // ── Build a cache of articles per unique category set (eliminates N+1) ─
      // Users with identical categoryIds share the same query result.
      const articleCache = new Map<string, ArticlePreview[]>()

      // Also pre-fetch a global top-news fallback (for users with no categories)
      const topArticles = await db.article.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: publishedSince },
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { title: true, slug: true },
      })

      const topArticlePreviews: ArticlePreview[] = topArticles.map(
        (a: { title: string; slug: string }) => ({
          title: a.title,
          url: `${frontendUrl}/articles/${a.slug}`,
        })
      )

      // Collect all unique category sets and fetch articles for each
      const uniqueCategorySets = new Set<string>(
        preferences.map((p: any) =>
          JSON.stringify([...(p.categoryIds || [])].sort())
        )
      )

      for (const key of uniqueCategorySets) {
        const categoryIds: string[] = JSON.parse(key) as string[]

        // Empty category set → will use topArticlePreviews fallback at send time
        if (categoryIds.length === 0) continue

        const articles = await db.article.findMany({
          where: {
            categoryId: { in: categoryIds },
            status: "PUBLISHED",
            publishedAt: { gte: publishedSince },
          },
          orderBy: { publishedAt: "desc" },
          take: 5,
          select: { title: true, slug: true },
        })

        const previews: ArticlePreview[] = articles.map(
          (a: { title: string; slug: string }) => ({
            title: a.title,
            url: `${frontendUrl}/articles/${a.slug}`,
          })
        )

        articleCache.set(key, previews)
      }

      // ── Build send tasks ──────────────────────────────────────────────────
      type SendTask = { email: string; articles: ArticlePreview[] }

      const tasks: SendTask[] = preferences
        .filter((p: any) => !!p.user.email)
        .map((p: any) => {
          const key = JSON.stringify([...(p.categoryIds || [])].sort())
          const cached = articleCache.get(key)

          // If user has no categories or their window has no new articles,
          // fall back to the global top-news digest
          const articles =
            cached && cached.length > 0 ? cached : topArticlePreviews

          return { email: p.user.email!, articles }
        })
        // If there's absolutely nothing to send (no new articles globally either), skip user
        .filter((t: SendTask) => t.articles.length > 0)

      // ── Dispatch in concurrent chunks ─────────────────────────────────────
      let emailsSent = 0
      let emailsFailed = 0

      for (const batchChunk of chunk(tasks, CHUNK_SIZE)) {
        const results = await Promise.allSettled(
          batchChunk.map((task) => sendNewsEmail(task.email, task.articles))
        )
        for (const result of results) {
          if (result.status === "fulfilled" && result.value === true) {
            emailsSent++
          } else {
            emailsFailed++
            if (result.status === "rejected") {
              console.error("[cron] Email dispatch error:", result.reason)
            }
          }
        }
      }

      return sendSuccess(res, {
        message: `${frequency} newsletter dispatch complete`,
        frequency,
        usersTargeted: preferences.length,
        emailsSent,
        emailsFailed,
      })
    } catch (error) {
      console.error("[cron.sendNewsletters]", error)
      return ApiErrors.internal(res)
    }
  }
}
