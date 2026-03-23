import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mes commandes',
}

export default function OrdersPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <h1 className="text-xl font-bold">Mes commandes</h1>
      </header>
      <section className="px-4 py-4 pb-24">
        {/* OrdersList component */}
      </section>
    </main>
  )
}
