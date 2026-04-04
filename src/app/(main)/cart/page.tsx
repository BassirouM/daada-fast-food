import type { Metadata } from 'next'
import UpsellSuggestions from '@/components/features/ai/UpsellSuggestions'

export const metadata: Metadata = {
  title: 'Panier',
}

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <h1 className="text-xl font-bold">Mon panier</h1>
      </header>
      <section className="px-4 py-4">
        {/* CartItemsList component */}

        {/* ─── Suggestions IA upsell ─── */}
        <UpsellSuggestions />
      </section>
      {/* Sticky checkout footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe">
        {/* CheckoutButton component */}
      </footer>
    </main>
  )
}
