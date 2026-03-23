import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Daada Fast Food',
    template: '%s | Daada Fast Food',
  },
  description: 'Livraison de nourriture rapide à Maroua, Cameroun. Commandez en ligne, payez Mobile Money.',
  keywords: ['livraison', 'nourriture', 'fast food', 'Maroua', 'Cameroun', 'mobile money'],
  authors: [{ name: 'Daada Fast Food' }],
  creator: 'Daada Fast Food',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Daada',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CM',
    title: 'Daada Fast Food',
    description: 'Livraison de nourriture rapide à Maroua, Cameroun',
    siteName: 'Daada Fast Food',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daada Fast Food',
    description: 'Livraison de nourriture rapide à Maroua, Cameroun',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF6B00' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
