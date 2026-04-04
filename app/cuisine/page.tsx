import Link from "next/link";

const MOCK_RECIPES = [
  {
    id: "r1",
    title: "Ndolé Traditionnel de Maman",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
    difficulty: "Moyen",
    prepTime: 30,
    cookTime: 60,
    tier: "free",
  },
  {
    id: "r2",
    title: "Poulet DG — Recette Facile",
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&h=300&fit=crop",
    difficulty: "Facile",
    prepTime: 20,
    cookTime: 45,
    tier: "free",
  },
  {
    id: "r3",
    title: "Eru Authentique",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    difficulty: "Moyen",
    prepTime: 25,
    cookTime: 50,
    tier: "free",
  },
  {
    id: "r4",
    title: "Secret : Sauce Arachide Parfaite",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop",
    difficulty: "Difficile",
    prepTime: 45,
    cookTime: 90,
    tier: "premium",
  },
  {
    id: "r5",
    title: "Beignets de Plantain Croustillants",
    imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop",
    difficulty: "Facile",
    prepTime: 10,
    cookTime: 20,
    tier: "premium",
  },
  {
    id: "r6",
    title: "Thieb Bou Djenn Camerounais",
    imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=300&fit=crop",
    difficulty: "Difficile",
    prepTime: 60,
    cookTime: 120,
    tier: "premium",
  },
];

const MOCK_ÉPICIERS = [
  { id: "e1", name: "Marché Central Maroua", distance: "0.8 km", specialty: "Épices, légumes frais" },
  { id: "e2", name: "Épicerie Chez Fatima", distance: "1.2 km", specialty: "Huile de palme, graines" },
  { id: "e3", name: "Grand Marché", distance: "2.1 km", specialty: "Tout ingrédients" },
];

const difficultyColor: Record<string, string> = {
  Facile: "text-green-600",
  Moyen: "text-amber-600",
  Difficile: "text-red-600",
};

export default function CuisinePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffbf5" }}>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 text-xs font-semibold text-white">
              ✨ Daada Cuisine
            </span>
            <h1
              className="mt-3 text-4xl font-black text-gray-900 sm:text-5xl"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Cuisinez comme un Chef camerounais 👨‍🍳
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Découvrez les secrets des meilleures cuisinières de Maroua. Recettes filmées en HD,
              instructions détaillées, ingrédients locaux.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Commencer gratuitement
              </Link>
              <span className="text-sm text-gray-500">
                Premium dès 1 500 FCFA/mois — annulable à tout moment
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Toutes les recettes
          </h2>
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
              3 gratuites
            </span>
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-xs font-semibold text-white">
              3 premium
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_RECIPES.map((recipe) => {
            const isPremium = recipe.tier === "premium";
            return (
              <div
                key={recipe.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      isPremium ? "blur-sm scale-105" : ""
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute right-3 top-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isPremium
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {isPremium ? "✨ PREMIUM" : "✓ GRATUIT"}
                    </span>
                  </div>
                  {isPremium && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                      <div className="flex flex-col items-center gap-2 rounded-xl bg-white/90 px-5 py-3">
                        <span className="text-2xl">🔓</span>
                        <span className="text-sm font-semibold text-gray-800">Débloquer la recette</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{recipe.title}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className={`font-medium ${difficultyColor[recipe.difficulty] ?? "text-gray-600"}`}>
                      {recipe.difficulty}
                    </span>
                    <span>•</span>
                    <span>🕐 {recipe.prepTime + recipe.cookTime} min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Épiciers */}
      <section className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            🗺️ Trouvez vos ingrédients à Maroua
          </h2>
          <p className="mt-1 text-gray-500">
            Épiceries et marchés partenaires avec les ingrédients de nos recettes
          </p>

          {/* Map placeholder */}
          <div className="mt-6 flex h-64 items-center justify-center rounded-2xl bg-gray-100">
            <div className="text-center">
              <span className="text-5xl">🗺️</span>
              <p className="mt-2 text-sm text-gray-500">
                Carte Mapbox — disponible après configuration
              </p>
            </div>
          </div>

          {/* Épiciers list */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MOCK_ÉPICIERS.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <h3 className="font-semibold text-gray-900">{e.name}</h3>
                <p className="mt-1 text-xs font-medium text-primary">{e.distance}</p>
                <p className="mt-1 text-sm text-gray-500">{e.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
