"use client";

import { useState } from "react";

const CATEGORIES = [
  { id: "all", label: "Tout", icon: "🍽️" },
  { id: "plats", label: "Plats", icon: "🥘" },
  { id: "grillades", label: "Grillades", icon: "🔥" },
  { id: "soupes", label: "Soupes", icon: "🥣" },
  { id: "accompagnements", label: "Accompagnements", icon: "🌿" },
  { id: "boissons", label: "Boissons", icon: "🥤" },
  { id: "desserts", label: "Desserts", icon: "🍰" },
];

const MOCK_MENU_ITEMS = [
  { id: "1", name: "Ndolé aux Crevettes", description: "Plat emblématique camerounais", price: 2500, category: "plats", imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop", isPopular: true, preparationTime: 25 },
  { id: "2", name: "Poulet DG", description: "Poulet grillé sauce tomate aux légumes", price: 3500, category: "plats", imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&h=300&fit=crop", isPopular: true, preparationTime: 30 },
  { id: "3", name: "Koki Maïs", description: "Gâteau de haricot vapeur traditionnel", price: 1500, category: "accompagnements", imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop", isPopular: false, preparationTime: 20 },
  { id: "4", name: "Boulettes de Viande", description: "Boulettes grillées aux épices africaines", price: 2000, category: "grillades", imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=300&fit=crop", isPopular: false, preparationTime: 20 },
  { id: "5", name: "Soupe de Poisson", description: "Soupe épicée avec légumes frais", price: 1800, category: "soupes", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop", isPopular: false, preparationTime: 30 },
  { id: "6", name: "Jus de Gingembre", description: "Jus frais maison sucré-épicé", price: 500, category: "boissons", imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop", isPopular: false, preparationTime: 5 },
  { id: "7", name: "Beignets de Coco", description: "Beignets chauds à la noix de coco", price: 800, category: "desserts", imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop", isPopular: false, preparationTime: 15 },
  { id: "8", name: "Eru avec Waterleaf", description: "Légumes eru mijotés avec waterleaf et huile de palme", price: 2200, category: "plats", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", isPopular: false, preparationTime: 40 },
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffbf5" }}>
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Notre Menu 🍽️
          </h1>
          <p className="mt-1 text-gray-500">
            {MOCK_MENU_ITEMS.length} plats disponibles — livrés en ~15 min
          </p>

          {/* Search */}
          <div className="mt-4 max-w-md">
            <div className="relative flex items-center">
              <svg
                className="absolute left-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">🔍</span>
            <h3 className="mt-4 font-semibold text-gray-900">Aucun plat trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez une autre recherche ou catégorie</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {filtered.length} plat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
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
                        <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          ⭐ Populaire
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    <p className="mt-1 text-xs text-gray-400">🕐 {item.preparationTime} min</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {item.price.toLocaleString("fr-CM")}{" "}
                        <span className="text-xs font-normal text-gray-500">FCFA</span>
                      </span>
                      <button
                        onClick={() => console.log("Add:", item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-600 transition-colors active:scale-95"
                        aria-label={`Ajouter ${item.name}`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
