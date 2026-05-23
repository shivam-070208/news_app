import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { Topbar } from "@/components/Topbar"
import "./globals.css"
import { Footer } from "@/components/footer"

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
        <ReactQueryProvider>
          <div className="mx-auto flex flex-col gap-6">
            <Topbar />
            {children}
            <Footer />
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
