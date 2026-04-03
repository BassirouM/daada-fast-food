import Link from "next/link";
import { RecipeCard } from "@daada/ui";
import { Badge } from "@daada/ui";

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
    title: "Poulet DG — Recette Facile",
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&h=300&fit=crop",
    difficulty: "easy" as const,
    prepTime: 20,
    cookTime: 45,
    tier: "free" as const,
  },
  {
    id: "r3",
    title: "Eru Authentique",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    difficulty: "medium" as const,
    prepTime: 25,
    cookTime: 50,
    tier: "free" as const,
  },
  {
    id: "r4",
    title: "Secret : Sauce Arachide Parfaite",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop",
    difficulty: "hard" as const,
    prepTime: 45,
    cookTime: 90,
    tier: "premium" as const,
  },
  {
    id: "r5",
    title: "Beignets de Plantain Croustillants",
    imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop",
    difficulty: "easy" as const,
    prepTime: 10,
    cookTime: 20,
    tier: "premium" as const,
  },
  {
    id: "r6",
    title: "Thieb Bou Djenn Camerounais",
    imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=300&fit=crop",
    difficulty: "hard" as const,
    prepTime: 60,
    cookTime: 120,
    tier: "premium" as const,
  },
];

const MOCK_ÉPICIERS = [
  { id: "e1", name: "Marché Central Maroua", distance: "0.8 km", specialty: "Épices, légumes frais" },
  { id: "e2", name: "Épicerie Chez Fatima", distance: "1.2 km", specialty: "Huile de palme, graines" },
  { id: "e3", name: "Grand Marché", distance: "2.1 km", specialty: "Tout ingrédients" },
];

export default function CuisinePage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 py-16 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Badge variant="premium">✨ Daada Cuisine</Badge>
            <h1 className="mt-3 font-display text-4xl font-black text-gray-900 dark:text-white sm:text-5xl">
              Cuisinez comme un Chef camerounais 👨‍🍳
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Découvrez les secrets des meilleures cuisinières de Maroua. Recettes filmées en HD,
              instructions détaillées, ingrédients locaux.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Commencer gratuitement
              </Link>
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                Premium dès 1 500 FCFA/mois — annulable à tout moment
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Toutes les recettes
          </h2>
          <div className="flex gap-2">
            <Badge variant="free">3 gratuites</Badge>
            <Badge variant="premium">3 premium</Badge>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_RECIPES.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              {...recipe}
              onClick={(id) => console.log("Open recipe:", id)}
            />
          ))}
        </div>
      </section>

      {/* Épiciers Map Placeholder */}
      <section className="border-t border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            🗺️ Trouvez vos ingrédients à Maroua
          </h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Épiceries et marchés partenaires avec les ingrédients de nos recettes
          </p>

          {/* Map placeholder */}
          <div className="mt-6 overflow-hidden rounded-2xl">
            <div className="flex h-64 items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <span className="text-5xl">🗺️</span>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Carte Mapbox — disponible après configuration
                </p>
              </div>
            </div>
          </div>

          {/* Épiciers list */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MOCK_ÉPICIERS.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{e.name}</h3>
                <p className="mt-1 text-xs text-primary font-medium">{e.distance}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{e.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
