const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

const PROD_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://daada-fast-food.vercel.app'

// Domaines Firebase (FCM, Analytics, Auth)
const FIREBASE_DOMAINS = [
  'https://*.firebaseapp.com',
  'https://*.firebase.com',
  'https://fcm.googleapis.com',
  'https://*.googleapis.com',
  'https://*.gstatic.com',
].join(' ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      // ── Headers de sécurité — toutes les pages ─────────────────────────────
      {
        source: '/(.*)',
        headers: [
          // Préchargement DNS
          { key: 'X-DNS-Prefetch-Control', value: 'on' },

          // Interdit l'affichage dans un iframe (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },

          // Interdit le MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Politique de referrer stricte
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Protection XSS (héritage navigateurs anciens)
          { key: 'X-XSS-Protection', value: '1; mode=block' },

          // HSTS — force HTTPS pendant 1 an
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // Permissions API (accès GPS limité à l'origine, caméra limitée à l'origine)
          {
            key: 'Permissions-Policy',
            value: [
              'geolocation=(self)',
              'camera=(self)',
              'microphone=()',
              'payment=(self)',
              'usb=()',
            ].join(', '),
          },

          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",

              // Scripts : self + inline (nécessaire pour Next.js) + Firebase
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' " + FIREBASE_DOMAINS,

              // Styles : self + inline (Tailwind CSS)
              "style-src 'self' 'unsafe-inline'",

              // Images : self + data: + blob: + HTTPS
              "img-src 'self' data: blob: https:",

              // Connexions : API Supabase + Firebase + domaine de prod
              [
                "connect-src 'self'",
                PROD_DOMAIN,
                'https://*.supabase.co',
                'wss://*.supabase.co',
                FIREBASE_DOMAINS,
              ].join(' '),

              // Polices (Inter, Syne via @fontsource)
              "font-src 'self' data:",

              // Iframes interdites
              "frame-src 'none'",

              // Plugins interdits
              "object-src 'none'",

              // Restriction base URL
              "base-uri 'self'",

              // Service Worker (PWA)
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },

      // ── Headers CORS — routes API ──────────────────────────────────────────
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: PROD_DOMAIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-csrf-token',
          },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
