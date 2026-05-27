import "@workspace/ui/globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "News App",
  description: "Your daily news updates",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
