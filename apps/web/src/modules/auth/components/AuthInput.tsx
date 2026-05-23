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
    <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-200">
      <span className="font-medium">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-4xl border border-input bg-input/30 px-4 text-base transition outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50"
        )}
      />
    </label>
  )
}
