export function AuthMessage({
  message,
  variant = "error",
}: Readonly<{ message: string; variant?: "error" | "success" }>) {
  if (!message) return null

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        variant === "success"
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
      }`}
    >
      {message}
    </div>
  )
}
