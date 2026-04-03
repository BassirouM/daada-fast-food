"use client";

import { useState } from "react";
import { MenuItemCard } from "@daada/ui";
import { CategoryTab } from "@daada/ui";
import { SearchInput } from "@daada/ui";

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
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
            Notre Menu 🍽️
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {MOCK_MENU_ITEMS.length} plats disponibles — livrés en ~15 min
          </p>

          {/* Search */}
          <div className="mt-4 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="mt-4">
            <CategoryTab
              categories={CATEGORIES}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">🔍</span>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Aucun plat trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez une autre recherche ou catégorie</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {filtered.length} plat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <MenuItemCard
                  key={item.id}
                  {...item}
                  onAdd={(id) => console.log("Add:", id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
