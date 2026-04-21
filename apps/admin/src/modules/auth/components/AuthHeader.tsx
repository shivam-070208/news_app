export function AuthHeader({
  title,
  subtitle,
}: Readonly<{ title: string; subtitle: string }>) {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {title}
      </h1>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
        {subtitle}
      </p>
    </div>
  )
}
