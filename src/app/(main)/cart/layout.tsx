import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Mon panier',
  description: 'Vérifiez vos articles et passez commande.',
}
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
