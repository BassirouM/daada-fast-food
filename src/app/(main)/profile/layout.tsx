import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Mon profil',
  description: 'Gérez votre profil, vos adresses et vos points de fidélité Daada.',
}
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
