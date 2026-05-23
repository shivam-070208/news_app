import { FeaturedCard } from "../components/feature-card"

const trendingHeadlines = [
  {
    id: "trending-1",
    title: "Central Banks Signal Halt to Rate Hikes Amid Cooling Inflation",
  },
  {
    id: "trending-2",
    title: "Breakthrough in Fusion Energy: Record Sustained Reaction in Oxford",
  },
  {
    id: "trending-3",
    title: "The Resurgence of Analog: Why Gen Z is Buying Film Cameras",
  },
  {
    id: "trending-4",
    title: "A New Era for Regional Rail: Faster Connections, Greener Travel",
  },
]

// New minimalist design for TrendingHeadlines
function TrendingHeadlines() {
  return (
    <aside className="w-full">
      <div className="flex items-center gap-2 pb-3">
        {/* Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-[#FF5962]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.75 2.75L12 8m0 0L10.25 2.75M12 8l3 2m-3-2l-3 2M20.25 15.75L12 8m8.25 7.75l-6.25-7m0 0L3.75 15.75m16.5 0l-6.25-7m0 0L3.75 15.75"
          />
        </svg>
        <span className="text-xs font-semibold tracking-[0.2em] text-[#FF5962] uppercase">
          Trending Now
        </span>
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {trendingHeadlines.map((item, index) => (
          <div key={item.id} className="py-6 first:pt-0 last:pb-0">
            <div className="mb-1 text-3xl font-medium text-neutral-200 select-none dark:text-neutral-700">
              <span className="opacity-60">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div>
              <p className="text-lg leading-snug font-[500] text-slate-900 dark:text-white">
                {item.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function HomePage() {
  return (
    <main className="w-dvw bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="max-7xl mx-auto w-dvw px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-8 gap-4">
          <div className="h-full space-y-6">
            <div className="grid-cols-span-2 h-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 shadow-lg shadow-slate-900/10 dark:border-slate-800">
              <div className="w-full bg-black">
                <iframe
                  className="h-full min-h-100 w-full"
                  src="https://www.youtube.com/embed/ZfJlNAMR4mY"
                  title="Featured news video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
          <div className="col-span-4">
            <FeaturedCard />
          </div>
          <div className="col-span-3">
            <TrendingHeadlines />
          </div>
        </div>
      </section>
    </main>
  )
}
