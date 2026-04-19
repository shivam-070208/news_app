import { LoginForm } from "../components/LoginForm"

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <LoginForm />
    </main>
  )
}
