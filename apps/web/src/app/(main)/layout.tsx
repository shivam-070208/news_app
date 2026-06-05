import { Footer } from "@/components/footer"
import { TopBar } from "@/components/TopBar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex flex-col gap-6">
      <Topbar />
      {children}
      <Footer />
    </div>
  )
}
