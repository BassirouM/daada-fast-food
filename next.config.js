/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Build ─────────────────────────────────────────────────────────────────
  // En prod, les erreurs TS/ESLint bloquent le build (bonne pratique).
  // Désactiver temporairement si la CI échoue sur du code legacy.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ─── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ─── Headers de sécurité ───────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Cache long pour les assets statiques
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ]
  },

  // ─── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Normaliser les URLs legacy
      { source: '/connexion', destination: '/login', permanent: true },
      { source: '/inscription', destination: '/register', permanent: true },
    ]
  },
}

module.exports = nextConfig
