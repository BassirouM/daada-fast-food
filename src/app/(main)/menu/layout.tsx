import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Menu',
  description: 'Découvrez tous nos plats — burgers, poulet, boissons. Commandez en ligne à Maroua.',
}
export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
