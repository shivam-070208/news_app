import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

export function AuthCard({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-sm",
        "dark:border-slate-800 dark:bg-slate-950/95"
      )}
    >
      {children}
    </div>
  )
}
