import "./globals.css"
import React from "react"

export const metadata = {
  title: "Admin Dashboard",
  description: "Admin panel for managing the news app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
