import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Menu',
}

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-orange">Daada</h1>
          {/* Cart icon, notifications */}
        </div>
      </header>

      {/* Categories horizontal scroll */}
      <section className="px-4 py-3">
        {/* MenuCategoryTabs component */}
      </section>

      {/* Featured items */}
      <section className="px-4 pb-4">
        {/* FeaturedItems component */}
      </section>

      {/* Menu items grid */}
      <section className="px-4 pb-24">
        {/* MenuItemGrid component */}
      </section>
    </main>
  )
}
