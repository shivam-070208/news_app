import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

export function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-4xl bg-white/90 p-10 shadow-xl ring-1 shadow-slate-900/5 ring-slate-200 dark:bg-slate-900/90 dark:ring-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm tracking-[0.32em] text-primary uppercase">
                Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Publisher control panel
              </h1>
            </div>
            <Button asChild>
              <Link href="/">View public site</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <h2 className="text-lg font-semibold">Latest drafts</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Draft stories and headline previews are managed from here.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <h2 className="text-lg font-semibold">Editorial overview</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Monitor content, publish status, and editorial workflow in one
                place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
