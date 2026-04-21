import React from "react"
import type { Metadata } from "next"
import "./globals.css"
import AdminSidebar from "@/src/components/admin-sidebar"

export const metadata: Metadata = {
  title: "News Admin",
  description: "News management portal",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
