const TEAM = [
  { name: "Aminatou Bello", role: "Fondatrice & CEO" },
  { name: "Ibrahim Oumarou", role: "CTO" },
  { name: "Fanta Djidda", role: "Chef Cuisinière" },
  { name: "Moussa Alamine", role: "Responsable Livraison" },
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fffbf5" }}>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white shadow-xl">
            DF
          </div>
          <h1
            className="mt-6 text-4xl font-black text-gray-900 sm:text-5xl"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Notre Histoire
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Daada Fast Food est née d'une passion pour la cuisine camerounaise et d'une envie
            de la partager avec le monde, en commençant par Maroua.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Playfair Display, Georgia, serif" }}
        >
          Comment tout a commencé
        </h2>
        <p className="mt-4 text-gray-600">
          En 2024, Aminatou Bello, cuisinière passionnée et entrepreneur, a remarqué que les habitants
          de Maroua n'avaient pas accès à une plateforme de livraison adaptée à leurs habitudes de
          paiement et à la qualité de leur connexion internet.
        </p>
        <p className="mt-4 text-gray-600">
          Avec son équipe, elle a créé Daada Fast Food — "Daada" signifiant "manger" en Fula,
          la langue principale de la région — pour offrir une expérience de commande simple,
          rapide et accessible à tous.
        </p>
        <p className="mt-4 text-gray-600">
          Aujourd'hui, nous travaillons avec plus de 20 restaurants partenaires à Maroua et livrons
          plus de 500 plats chaque jour, en acceptant les paiements Mobile Money (Orange Money et MTN MoMo).
        </p>
      </section>

      {/* Team */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2
            className="text-center text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Notre Équipe
          </h2>
          <p className="mt-2 text-center text-gray-500">
            Des talents camerounais au service de votre satisfaction
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-md">
                  {getInitials(member.name)}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2
          className="text-center text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Playfair Display, Georgia, serif" }}
        >
          Nos Valeurs
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-gray-100 bg-white p-6"
            >
              <span className="text-3xl">{value.icon}</span>
              <h3 className="mt-3 font-semibold text-gray-900">{value.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{value.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
