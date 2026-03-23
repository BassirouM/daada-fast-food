import { Header } from '@/components/features/Header'
import { BottomNav } from '@/components/features/BottomNav'
import { Sidebar } from '@/components/features/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        {/* pt-14 md:pt-16 offsets fixed header; pb-16 md:pb-0 offsets fixed bottom nav */}
        <main className="flex-1 pt-14 md:pt-16 pb-16 md:pb-0 animate-page-in">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
