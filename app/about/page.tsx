import { Avatar } from "@daada/ui";

const TEAM = [
  { name: "Aminatou Bello", role: "Fondatrice & CEO", emoji: "👩🏾" },
  { name: "Ibrahim Oumarou", role: "CTO", emoji: "👨🏾‍💻" },
  { name: "Fanta Djidda", role: "Chef Cuisinière", emoji: "👩🏾‍🍳" },
  { name: "Moussa Alamine", role: "Responsable Livraison", emoji: "🛵" },
];

const VALUES = [
  {
    icon: "🌍",
    title: "Ancrage Local",
    description: "Nous travaillons avec des producteurs locaux de Maroua et de la région de l'Extrême-Nord.",
  },
  {
    icon: "⚡",
    title: "Rapidité & Fiabilité",
    description: "Livraison en moins de 20 minutes dans toute la ville, avec suivi en temps réel.",
  },
  {
    icon: "🔒",
    title: "Paiement Sécurisé",
    description: "Orange Money, MTN MoMo et paiement à la livraison. Votre argent est en sécurité.",
  },
  {
    icon: "♻️",
    title: "Engagement Environnemental",
    description: "Emballages recyclables, circuits courts, zéro gaspillage alimentaire.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-amber-50 py-16 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white shadow-xl">
            DF
          </div>
          <h1 className="mt-6 font-display text-4xl font-black text-gray-900 dark:text-white sm:text-5xl">
            Notre Histoire
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Daada Fast Food est née d'une passion pour la cuisine camerounaise et d'une envie
            de la partager avec le monde, en commençant par Maroua.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Comment tout a commencé
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            En 2024, Aminatou Bello, cuisinière passionnée et entrepreneur, a remarqué que les habitants
            de Maroua n'avaient pas accès à une plateforme de livraison adaptée à leurs habitudes de
            paiement et à la qualité de leur connexion internet.
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Avec son équipe, elle a créé Daada Fast Food — "Daada" signifiant "manger" en Fula,
            la langue principale de la région — pour offrir une expérience de commande simple,
            rapide et accessible à tous.
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Aujourd'hui, nous travaillons avec plus de 20 restaurants partenaires à Maroua et livrons
            plus de 500 plats chaque jour, en acceptant les paiements Mobile Money (Orange Money et MTN MoMo).
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white text-center">
            Notre Équipe
          </h2>
          <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
            Des talents camerounais au service de votre satisfaction
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <Avatar name={member.name} size="xl" />
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white text-center">
          Nos Valeurs
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="text-3xl">{value.icon}</span>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{value.title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{value.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
