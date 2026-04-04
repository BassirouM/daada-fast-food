import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Daada Fast Food — Saveurs de Maroua",
    template: "%s | Daada Fast Food",
  },
  description:
    "Commandez vos plats préférés de Maroua, Cameroun. Livraison rapide, paiement Mobile Money.",
  keywords: ["fast food", "Maroua", "Cameroun", "livraison", "ndolé", "poulet DG", "Mobile Money"],
  authors: [{ name: "Daada Fast Food" }],
  openGraph: {
    type: "website",
    locale: "fr_CM",
    siteName: "Daada Fast Food",
    title: "Daada Fast Food — Saveurs de Maroua",
    description: "Commandez vos plats préférés de Maroua, Cameroun.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F97316",
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
            DF
          </div>
          <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "Playfair Display, serif" }}>
            Daada<span className="text-primary"> Fast Food</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {[
            { href: "/", label: "Accueil" },
            { href: "/menu", label: "Menu" },
            { href: "/cuisine", label: "Cuisine" },
            { href: "/about", label: "À propos" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-green-500" style={{ animation: "pulse 2s infinite" }} />
            <span className="text-xs font-medium text-green-700">Ouvert · ferme à 22h</span>
          </div>
          <Link
            href="/login"
            className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors md:block"
          >
            Connexion
          </Link>
          {/* Mobile menu placeholder */}
          <div className="flex gap-1 md:hidden">
            {[
              { href: "/menu", label: "Menu" },
              { href: "/login", label: "Conn." },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                DF
              </div>
              <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "Playfair Display, serif" }}>
                Daada Fast Food
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500 max-w-xs">
              Saveurs authentiques de Maroua, livrées directement chez vous. Vite, frais, délicieux. 🍽️
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://wa.me/237600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href="https://instagram.com/daadafastfood"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600 transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Horaires */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Horaires</h3>
            <ul className="mt-3 space-y-1 text-sm text-gray-500">
              <li>Lun – Ven : <span className="font-medium text-gray-700">08h00 – 22h00</span></li>
              <li>Sam – Dim : <span className="font-medium text-gray-700">09h00 – 23h00</span></li>
            </ul>
          </div>

          {/* Liens */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Liens</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: "/menu", label: "Notre menu" },
                { href: "/cuisine", label: "Recettes" },
                { href: "/about", label: "À propos" },
                { href: "/login", label: "Connexion" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Daada Fast Food — Maroua, Cameroun. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen" style={{ backgroundColor: "#fffbf5" }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
