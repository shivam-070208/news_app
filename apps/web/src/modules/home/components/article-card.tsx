import Link from "next/link"

type ArticleCardProps = {
  article: {
    id: string
    title: string
    slug: string
    summary: string
    thumbnailUrl: string | null
    category: { name: string; slug: string }
    author: { name: string | null }
    publishedAt: string | null
    viewCount: number
  }
  href?: string
}

export function ArticleCard({ article, href }: ArticleCardProps) {
  return (
    <article className="grid gap-4 bg-transparent px-0 py-0">
      {article.thumbnailUrl && (
        <div>
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="mb-4 aspect-[16/10] w-full object-cover object-center"
          />
        </div>
      )}
      <div className="mb-2 font-semibold tracking-[0.24em] text-slate-500 uppercase">
        {article.category.name}
      </div>
      <div>
        <h3 className="mb-2 cursor-pointer text-xl leading-snug font-bold text-slate-950 dark:text-white">
          {href ? <Link href={href}>{article.title}</Link> : article.title}
        </h3>
      </div>
      <p className="mb-1 text-[15px] leading-[1.65] text-slate-600 dark:text-slate-400">
        {article.summary}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>By {article.author.name ?? "News Desk"}</span>
        {article.publishedAt ? (
          <>
            <span>·</span>
            <span>
              {new Date(article.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </>
        ) : null}
      </div>
    </article>
  )
}
