import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Mes commandes',
  description: 'Suivez vos commandes en temps réel et consultez votre historique.',
}
export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
