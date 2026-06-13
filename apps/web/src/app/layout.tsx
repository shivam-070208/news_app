import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const inter = Inter({
  variable: "--font-inter",
  weight: ["400"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "News App",
  description: "Public news site with dashboard access and auth.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="max-w-9xl min-h-full bg-slate-50 pt-4 text-slate-950 dark:bg-slate-950 dark:text-white">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  )
}
