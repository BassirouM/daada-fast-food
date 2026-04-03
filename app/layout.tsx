import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@daada/ui";
import { Footer } from "@daada/ui";
import { ToastProvider } from "@daada/ui";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFBF5" },
    { media: "(prefers-color-scheme: dark)", color: "#1A0A00" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background-light dark:bg-background-dark">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
