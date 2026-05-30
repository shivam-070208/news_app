import Link from "next/link"
import { ReactNode } from "react"

interface SectionLayoutProps {
  title: string
  href: string
  description?: string
  children: ReactNode
}

export function SectionLayout({
  title,
  href,
  description,
  children,
}: SectionLayoutProps) {
  return (
    <section className="rounded-[2rem] p-6 shadow-sm shadow-slate-900/5">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
        <Link
          href={href}
          className="text-sm font-semibold text-slate-700 transition hover:text-primary dark:text-slate-300 dark:hover:text-primary"
        >
          Show more
        </Link>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
