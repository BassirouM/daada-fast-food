import Link from "next/link";
import { MenuItemCard } from "@daada/ui";
import { RecipeCard } from "@daada/ui";

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_POPULAR_ITEMS = [
  {
    id: "1",
    name: "Ndolé aux Crevettes",
    description: "Le plat emblématique camerounais avec feuilles de ndolé et grosses crevettes.",
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
    isPopular: true,
    preparationTime: 25,
  },
  {
    id: "2",
    name: "Poulet DG",
    description: "Poulet grillé sauce tomate aux légumes, accompagné de plantain frit.",
    price: 3500,
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&h=300&fit=crop",
    isPopular: true,
    preparationTime: 30,
  },
  {
    id: "3",
    name: "Koki Maïs",
    description: "Gâteau de haricot vapeur traditionnel, épicé et parfumé.",
    price: 1500,
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop",
    isPopular: false,
    preparationTime: 20,
  },
  {
    id: "4",
    name: "Boulettes de Viande",
    description: "Boulettes grillées marinées aux épices africaines, sauce arachide.",
    price: 2000,
    imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=300&fit=crop",
    isPopular: false,
    preparationTime: 20,
  },
];

const MOCK_RECIPES = [
  {
    id: "r1",
    title: "Ndolé Traditionnel de Maman",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
    difficulty: "medium" as const,
    prepTime: 30,
    cookTime: 60,
    tier: "free" as const,
  },
  {
    id: "r2",
    title: "Poulet DG Maison",
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&h=300&fit=crop",
    difficulty: "easy" as const,
    prepTime: 20,
    cookTime: 45,
    tier: "free" as const,
  },
  {
    id: "r3",
    title: "Secret : Sauce Arachide Parfaite",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop",
    difficulty: "hard" as const,
    prepTime: 45,
    cookTime: 90,
    tier: "premium" as const,
  },
];

const CATEGORIES = [
  { id: "plats", label: "Plats", icon: "🍽️", count: 24 },
  { id: "grillades", label: "Grillades", icon: "🔥", count: 12 },
  { id: "soupes", label: "Soupes", icon: "🥣", count: 8 },
  { id: "accompagnements", label: "Accompagnements", icon: "🌿", count: 15 },
  { id: "boissons", label: "Boissons", icon: "🥤", count: 10 },
  { id: "desserts", label: "Desserts", icon: "🍰", count: 6 },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-background-light to-amber-50 dark:from-background-dark dark:via-gray-900 dark:to-primary-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary dark:bg-primary-900/30">
                🌍 Maroua, Cameroun
              </span>
              <h1 className="mt-4 font-display text-4xl font-black leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Saveurs de Maroua,
                <br />
                <span className="text-primary">livrées chez vous</span> 🍽️
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Plats authentiques camerounais préparés avec amour. Commandez en ligne,
                payez par Mobile Money, recevez chaud.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-primary-600 transition-colors"
                >
                  Commander maintenant
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/cuisine"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                >
                  Voir les recettes 👨‍🍳
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 flex gap-8">
                {[
                  { value: "500+", label: "Plats livrés/jour" },
                  { value: "15 min", label: "Livraison moyenne" },
                  { value: "4.8⭐", label: "Note clients" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex items-center justify-center">
              <div className="relative h-80 w-80 sm:h-96 sm:w-96 lg:h-[28rem] lg:w-[28rem]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl" />
                <img
                  src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=600&fit=crop"
                  alt="Ndolé camerounais"
                  className="relative h-full w-full rounded-3xl object-cover shadow-2xl"
                />
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xl dark:bg-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl dark:bg-green-900/30">
                    🛵
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Livraison rapide</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">~15 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-14 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Parcourir par catégorie
          </h2>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-primary hover:bg-primary-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary dark:hover:bg-primary-950"
              >
                <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
                <span className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-600">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular items */}
      <section className="bg-background-light py-14 dark:bg-background-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Plats populaires ⭐
            </h2>
            <Link href="/menu" className="text-sm font-medium text-primary hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_POPULAR_ITEMS.map((item) => (
              <MenuItemCard
                key={item.id}
                {...item}
                onAdd={(id) => console.log("Add to cart:", id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Daada Cuisine teaser */}
      <section className="bg-gradient-to-r from-primary to-secondary py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-white/80">
                Nouveau — Daada Cuisine
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
                Cuisinez comme un Chef camerounais 👨‍🍳
              </h2>
              <p className="mt-3 text-white/80">
                Accédez à plus de 50 recettes authentiques filmées en HD. Apprenez les secrets
                des meilleures cuisinières de Maroua.
              </p>
              <div className="mt-6 flex gap-4">
                <Link
                  href="/cuisine"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-gray-50 transition-colors"
                >
                  Découvrir gratuitement
                </Link>
                <span className="flex items-center text-sm text-white/80">
                  Premium dès 1 500 FCFA/mois
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MOCK_RECIPES.map((recipe) => (
                <RecipeCard key={recipe.id} {...recipe} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Banner */}
      <section className="bg-gray-900 py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            📱 Téléchargez l'application Daada
          </h2>
          <p className="mt-2 text-gray-400">
            Commandez encore plus vite, suivez vos livraisons en temps réel
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-3 text-white hover:bg-white/20 transition-colors border border-white/20"
            >
              <span className="text-2xl">🍎</span>
              <div className="text-left">
                <div className="text-xs text-gray-400">Bientôt sur</div>
                <div className="font-semibold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-3 text-white hover:bg-white/20 transition-colors border border-white/20"
            >
              <span className="text-2xl">🤖</span>
              <div className="text-left">
                <div className="text-xs text-gray-400">Bientôt sur</div>
                <div className="font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
