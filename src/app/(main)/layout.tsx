import { BottomNav } from '@/components/ui/bottom-nav'
import { PageTransition } from '@/components/ui/page-transition'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTransition>
        {children}
      </PageTransition>
      <BottomNav />
    </>
  )
}
