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

const HERO_DISHES = [
  { src: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=800&fit=crop", alt: "Ndolé aux Crevettes" },
  { src: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=800&h=800&fit=crop", alt: "Poulet DG" },
  { src: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=800&fit=crop", alt: "Koki Maïs" },
  { src: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&h=800&fit=crop", alt: "Boulettes de Viande" },
  { src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=800&fit=crop", alt: "Plat du jour" },
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
    <div className="flex flex-col pb-20 md:pb-0">
      {/* Promo strip */}
      <div className="overflow-hidden bg-primary py-2">
        <div className="flex w-max animate-promo gap-16 whitespace-nowrap text-xs font-semibold text-white">
          {["🎉 Livraison GRATUITE dès 3 plats commandés", "⚡ Livraison en moins de 20 min garantie", "🏆 La meilleure bouffe de Maroua", "💳 Paiement Orange Money & MTN MoMo", "🛵 500+ plats livrés chaque jour"].map((msg) => (
            <span key={msg}>{msg}</span>
          ))}
        </div>
      </div>

      {/* Search bar — centrée */}
      <div className="bg-white px-4 py-4 sm:px-6">
        <form
          method="GET"
          action="/menu"
          className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/40 px-4 py-3 shadow-sm transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100"
        >
          <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Chercher un plat… Ndolé, Poulet DG, Koki Maïs…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
            Chercher
          </button>
        </form>
      </div>

      {/* Hero — plein écran avec texte en overlay */}
      <section className="relative min-h-[70vh] overflow-hidden">
        {/* Diaporama en fond plein écran */}
        {HERO_DISHES.map((dish, i) => (
          <img
            key={dish.alt}
            src={dish.src}
            alt={dish.alt}
            className="hero-slide absolute inset-0 h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
        {/* Overlay sombre dégradé */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />

        {/* Contenu en overlay */}
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 sm:px-6">
          <div className="max-w-xl py-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                🌍 Maroua, Cameroun
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow">
                🏆 La meilleure bouffe de Maroua
              </span>
            </div>
            <h1
              className="mt-4 text-4xl font-black leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Saveurs de Maroua, <span className="text-orange-300">livrées chez vous</span> 🍽️
            </h1>
            <p className="mt-4 max-w-md text-base text-white/85">
              Plats authentiques camerounais préparés avec amour. Commandez en ligne, payez par Mobile Money, recevez chaud.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
              >
                Commander maintenant
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/cuisine"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Voir les recettes 👨‍🍳
              </Link>
            </div>

            {/* Paiement + livraison */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-xs text-white/70">🚚 Livraison <strong className="text-white">500 FCFA</strong> · Gratuit dès <strong className="text-white">3 plats commandés</strong></span>
              <span className="text-white/40">|</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">OM</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-gray-900">MTN</span>
            </div>

            {/* Stats */}
            <div className="mt-7 flex gap-8 border-t border-white/20 pt-5">
              {[
                { value: "500+", label: "Plats livrés/jour" },
                { value: "15 min", label: "Livraison moyenne" },
                { value: "4.8 ⭐", label: "Note clients" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-9">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            className="text-2xl font-bold text-gray-900 sm:text-3xl"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Parcourir par catégorie
          </h2>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-6 sm:overflow-visible sm:pb-0" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                className="group flex flex-shrink-0 flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-primary hover:bg-orange-50 sm:flex-shrink"
              >
                <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
                <span className="text-center text-xs font-medium text-gray-700">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular items */}
      <section className="py-9" style={{ backgroundColor: "#fffbf5" }}>
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
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                    >
                      Voir →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daada Cuisine teaser */}
      <section className="bg-gradient-to-r from-primary to-secondary py-9">
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

      {/* How it works */}
      <section className="py-9" style={{ backgroundColor: "#fff8f0" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">Simple &amp; rapide</span>
            <h2
              className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Commander en 4 étapes
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { step: "01", icon: "🛒", title: "Choisissez", desc: "Parcourez le menu, trouvez vos plats préférés.", color: "bg-orange-100" },
              { step: "02", icon: "📱", title: "Commandez", desc: "Validez votre panier en quelques secondes.", color: "bg-amber-100" },
              { step: "03", icon: "💳", title: "Payez", desc: "Orange Money ou MTN MoMo, en 3 clics.", color: "bg-yellow-100" },
              { step: "04", icon: "🛵", title: "Recevez", desc: "Votre repas chaud livré en moins de 20 min.", color: "bg-lime-100" },
            ].map((item, i, arr) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {i < arr.length - 1 && (
                  <div className="absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-5rem)] border-t-2 border-dashed border-orange-200 sm:block" />
                )}
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} text-3xl shadow-sm`}>
                  {item.icon}
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 max-w-[130px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials marquee */}
      <section className="bg-white py-9 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-5">
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

      {/* FAQ */}
      <section className="bg-white py-9 border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2
            className="text-center text-2xl font-bold text-gray-900 sm:text-3xl"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Questions fréquentes
          </h2>
          <div className="mt-5 space-y-3">
            {[
              {
                q: "Quels quartiers de Maroua livrez-vous ?",
                a: "Nous livrons dans tout Maroua dans un rayon de 5 km : Domayo, Dougoi, Kakataré, Pitoare, Kongola, Balaza, Gadala, Lopéré et bien d'autres quartiers.",
              },
              {
                q: "Combien coûtent les frais de livraison ?",
                a: "Les frais de livraison sont de 500 FCFA. La livraison est gratuite à partir de 3 plats commandés.",
              },
              {
                q: "Puis-je payer en espèces à la livraison ?",
                a: "Non. Pour garantir rapidité et sécurité, nous acceptons uniquement Orange Money et MTN MoMo. Le paiement se fait en 3 clics avant la livraison.",
              },
              {
                q: "Quel est le délai de livraison ?",
                a: "Notre délai moyen est de 15 minutes. Nous garantissons la livraison en moins de 20 minutes dans tous les quartiers couverts.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group cursor-pointer rounded-2xl border border-gray-100 bg-gray-50 p-4 open:border-orange-100 open:bg-orange-50 transition-colors"
              >
                <summary className="flex list-none items-center justify-between text-sm font-semibold text-gray-900">
                  {faq.q}
                  <span className="ml-4 flex-shrink-0 text-xl font-light text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Banner */}
      <section className="bg-gray-900 py-9">
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
            {/* App Store */}
            <a href="#" className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-white transition-colors hover:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Bientôt sur</div>
                <div className="font-semibold">App Store</div>
              </div>
            </a>
            {/* Google Play */}
            <a href="#" className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-white transition-colors hover:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.79-2.79-10.8 9.86zm-1.14-21.3c-.06.2-.04.43.04.66v18.2c0 .22.06.43.16.61l.1.1 10.2-10.2v-.24L2.04 2.46zm14.7 13.78 3.43-1.98c.98-.57.98-1.49 0-2.06l-3.43-1.98-3.07 3.01 3.07 3.01zm-16.07 8.9.1-.1 10.96-6.32-2.78-2.78L.67 22.36c-.28.26-.42.6-.4.94.02.36.18.69.4.84z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Bientôt sur</div>
                <div className="font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </section>
      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/237600000000?text=Bonjour%20Daada%2C%20je%20voudrais%20commander%20!"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Commander via WhatsApp"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition-transform hover:scale-110 hover:bg-green-600 md:bottom-6"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Sticky mobile CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div>
          <p className="text-xs font-semibold text-gray-900">Prêt à commander ?</p>
          <p className="text-xs text-gray-400">Livraison dès 200 FCFA</p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          Commander 🛵
        </Link>
      </div>
    </div>
  );
}
