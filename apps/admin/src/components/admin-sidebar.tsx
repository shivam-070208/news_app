"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NewspaperIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6Z" />
  </svg>
)

const PlusCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
)

const navItems: NavItem[] = [
  {
    label: "Editors",
    href: "/editors",
    icon: <NewspaperIcon />,
  },
  {
    label: "News Management",
    href: "/news",
    icon: <NewspaperIcon />,
  },
  {
    label: "Add News",
    href: "/addNews",
    icon: <PlusCircleIcon />,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex min-h-screen w-64 shrink-0 flex-col",
        "border-r border-sidebar-border bg-sidebar",
        "shadow-[1px_0_20px_0_rgba(0,0,0,0.06)]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            "bg-primary text-primary-foreground shadow-md"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          </svg>
        </div>
        <div>
          <p className="text-sm leading-tight font-semibold tracking-tight text-sidebar-foreground">
            News Admin
          </p>
          <p className="text-xs text-muted-foreground">Management Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase select-none">
          Menu
        </p>

        {navItems.map((item) => {
          const safePathname = pathname || ""
          const isActive =
            safePathname === item.href ||
            safePathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-all duration-150 ease-in-out",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {/* Icon wrapper */}
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-150",
                  isActive
                    ? "bg-white/15 text-primary-foreground"
                    : "bg-sidebar-accent/60 text-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
              </span>

              <span className="truncate">{item.label}</span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary-foreground/70" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              Admin User
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              admin@newsapp.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
