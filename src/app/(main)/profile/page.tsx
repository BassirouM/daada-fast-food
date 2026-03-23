import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil',
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <h1 className="text-xl font-bold">Mon profil</h1>
      </header>
      <section className="px-4 py-4 pb-24 space-y-4">
        {/* UserProfileCard component */}
        {/* DeliveryAddressList component */}
        {/* NotificationSettings component */}
        {/* LogoutButton component */}
      </section>
    </main>
  )
}
