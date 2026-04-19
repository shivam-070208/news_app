import type { ChangeEvent } from "react"
import { cn } from "@workspace/ui/lib/utils"

export function AuthInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
}: Readonly<{
  label: string
  id: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}>) {
  return (
    <label className="block space-y-2 text-left text-sm text-slate-700 dark:text-slate-200">
      <span className="font-medium">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={cn(
          "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200/80 disabled:cursor-not-allowed disabled:opacity-60",
          "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700/70"
        )}
        autoComplete={id === "email" ? "email" : "current-password"}
      />
    </label>
  )
}
