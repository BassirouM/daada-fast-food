import Link from "next/link";

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
    difficulty: "Moyen",
    totalTime: 90,
    tier: "free",
  },
  {
    id: "r2",
    title: "Poulet DG Maison",
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&h=300&fit=crop",
    difficulty: "Facile",
    totalTime: 65,
    tier: "free",
  },
  {
    id: "r3",
    title: "Secret : Sauce Arachide Parfaite",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop",
    difficulty: "Difficile",
    totalTime: 135,
    tier: "premium",
  },
];

const TESTIMONIALS = [
  {
    name: "Aïssatou D.",
    quarter: "Domayo",
    rating: 5,
    text: "Le Ndolé était exactement comme celui de ma maman. Livré en 12 minutes, encore chaud !",
    avatar: "A",
  },
  {
    name: "Moussa K.",
    quarter: "Dougoi",
    rating: 5,
    text: "Le Poulet DG est incroyable, le meilleur de Maroua. Je commande chaque vendredi.",
    avatar: "M",
  },
  {
    name: "Fatima B.",
    quarter: "Kakataré",
    rating: 5,
    text: "Paiement Orange Money très simple. Le livreur était super sympa. Je recommande !",
    avatar: "F",
  },
  {
    name: "Ibrahim A.",
    quarter: "Pitoare",
    rating: 5,
    text: "Les recettes Daada Cuisine m'ont appris à faire la sauce arachide. Incroyable !",
    avatar: "I",
  },
  {
    name: "Ramatou N.",
    quarter: "Kongola",
    rating: 5,
    text: "Commande à 19h, livraison à 19h14. Un record ! Et c'était délicieux en plus.",
    avatar: "R",
  },
  {
    name: "Abdoulaye S.",
    quarter: "Balaza",
    rating: 4,
    text: "Très bonne qualité pour le prix. Les boulettes de viande sont mes préférées.",
    avatar: "A",
  },
  {
    name: "Haoua M.",
    quarter: "Gadala",
    rating: 5,
    text: "Service impeccable ! Mon mari et mes enfants adorent. On commande 3x par semaine.",
    avatar: "H",
  },
  {
    name: "Oumarou T.",
    quarter: "Lopéré",
    rating: 5,
    text: "Le Koki Maïs me rappelle mon enfance. Merci Daada pour ces saveurs authentiques !",
    avatar: "O",
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

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-primary">
                  🌍 Maroua, Cameroun
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white shadow-sm">
                  🏆 La meilleure bouffe de Maroua
                </span>
              </div>
              <h1
                className="mt-4 text-4xl font-black leading-tight text-gray-900 sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Saveurs de Maroua,
                <br />
                <span className="text-primary">livrées chez vous</span> 🍽️
              </h1>
              <p className="mt-4 text-lg text-gray-600">
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
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Voir les recettes 👨‍🍳
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 flex gap-8">
                {[
                  { value: "500+", label: "Plats livrés/jour" },
                  { value: "15 min", label: "Livraison moyenne" },
                  { value: "4.8 ⭐", label: "Note clients" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero image */}
            <div className="relative flex items-center justify-center">
              <div className="relative h-80 w-80 sm:h-96 sm:w-96 lg:h-[28rem] lg:w-[28rem]">
                <img
                  src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=600&fit=crop"
                  alt="Ndolé camerounais"
                  className="h-full w-full rounded-3xl object-cover shadow-2xl"
                />
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">
                    🛵
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Livraison rapide</div>
                    <div className="text-sm font-semibold text-gray-900">~15 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            className="text-2xl font-bold text-gray-900 sm:text-3xl"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Parcourir par catégorie
          </h2>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-primary hover:bg-orange-50"
              >
                <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
                <span className="text-center text-xs font-medium text-gray-700">{cat.label}</span>
                <span className="text-xs text-gray-400">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Comment ça marche ?
            </h2>
            <p className="mt-2 text-sm text-gray-500">Recevez votre repas en 4 étapes simples</p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              {
                step: "01",
                icon: "🛒",
                title: "Choisissez",
                desc: "Parcourez le menu et sélectionnez vos plats préférés.",
              },
              {
                step: "02",
                icon: "📱",
                title: "Commandez",
                desc: "Passez votre commande en quelques secondes depuis votre téléphone.",
              },
              {
                step: "03",
                icon: "💳",
                title: "Payez",
                desc: "Réglez facilement par Orange Money ou MTN MoMo.",
              },
              {
                step: "04",
                icon: "🛵",
                title: "Recevez",
                desc: "Votre repas arrive chaud chez vous en moins de 20 minutes.",
              },
            ].map((item, i, arr) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < arr.length - 1 && (
                  <div className="absolute left-[calc(50%+2.5rem)] top-6 hidden h-0.5 w-[calc(100%-5rem)] bg-orange-100 sm:block" />
                )}
                {/* Icon circle */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-3xl ring-4 ring-white shadow-sm">
                  {item.icon}
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 max-w-[140px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular items */}
      <section className="py-14" style={{ backgroundColor: "#fffbf5" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Plats populaires ⭐
            </h2>
            <Link href="/menu" className="text-sm font-medium text-primary hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_POPULAR_ITEMS.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {item.isPopular && (
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        ⭐ Populaire
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    🕐 {item.preparationTime} min
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {item.price.toLocaleString("fr-CM")}{" "}
                      <span className="text-xs font-normal text-gray-500">FCFA</span>
                    </span>
                    <Link
                      href="/menu"
                      aria-label={`Voir ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
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
              <h2
                className="mt-2 text-3xl font-bold text-white sm:text-4xl"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Cuisinez comme un Chef camerounais 👨‍🍳
              </h2>
              <p className="mt-3 text-white/80">
                Accédez à plus de 50 recettes authentiques filmées en HD. Apprenez les secrets
                des meilleures cuisinières de Maroua.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <Link
                  href="/cuisine"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-gray-50 transition-colors"
                >
                  Découvrir gratuitement
                </Link>
                <span className="text-sm text-white/80">Premium dès 1 500 FCFA/mois</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MOCK_RECIPES.map((recipe) => (
                <div
                  key={recipe.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className={`h-full w-full object-cover ${recipe.tier === "premium" ? "blur-sm scale-105" : ""}`}
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        recipe.tier === "premium"
                          ? "bg-amber-400 text-white"
                          : "bg-green-500 text-white"
                      }`}>
                        {recipe.tier === "premium" ? "✨" : "✓"}
                      </span>
                    </div>
                    {recipe.tier === "premium" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-gray-800">
                          🔓 Premium
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-white line-clamp-2">{recipe.title}</p>
                    <p className="mt-0.5 text-xs text-white/60">{recipe.difficulty} · {recipe.totalTime} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials marquee */}
      <section className="bg-white py-14 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Ce que disent nos clients ❤️
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Plus de 2 000 familles de Maroua nous font confiance
            </p>
          </div>
        </div>

        {/* Scrolling band — duplicated for infinite loop */}
        <div className="relative w-full overflow-hidden">
          <div className="flex w-max animate-marquee gap-5">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div
                key={i}
                className="w-72 flex-shrink-0 rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">📍 {t.quarter}, Maroua</p>
                  </div>
                  <div className="ml-auto flex text-amber-400 text-xs">
                    {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Banner */}
      <section className="bg-gray-900 py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            📱 Téléchargez l'application Daada
          </h2>
          <p className="mt-2 text-gray-400">
            Commandez encore plus vite, suivez vos livraisons en temps réel
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              { icon: "🍎", store: "App Store" },
              { icon: "🤖", store: "Google Play" },
            ].map((app) => (
              <a
                key={app.store}
                href="#"
                className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-white hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">{app.icon}</span>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Bientôt sur</div>
                  <div className="font-semibold">{app.store}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
