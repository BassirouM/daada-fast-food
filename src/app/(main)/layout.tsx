import { Header } from '@/components/features/Header'
import { BottomNav } from '@/components/features/BottomNav'
import { Sidebar } from '@/components/features/Sidebar'
import { CartDrawer } from '@/components/features/CartDrawer'
import { FloatingCartButton } from '@/components/features/FloatingCartButton'
import { FlyToCartProvider } from '@/components/features/FlyToCartProvider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <FlyToCartProvider>
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
      <CartDrawer />
      <FloatingCartButton />
    </FlyToCartProvider>
  )
}
