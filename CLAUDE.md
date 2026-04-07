# Daada Fast Food — Architecture Documentation

App de livraison de nourriture à Maroua, Cameroun.

- **Repo GitHub :** [BassirouM/daada-fast-food](https://github.com/BassirouM/daada-fast-food)
- **Production :** [daada-web.vercel.app](https://daada-web.vercel.app)
- **Dossier local :** `C:\Users\user\Desktop\daada-old`

## Stack Technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Framework | Next.js 15 App Router | Routing, SSR, API Routes |
| Langage | TypeScript (strict) | Typage statique |
| Style | Tailwind CSS | UI — variables CSS custom |
| Design System | `packages/ui` (@daada/ui) | Atoms / Molecules / Organisms |
| Fetching | SWR | Data fetching + cache |
| State | Zustand (persist) | State management global |
| Animations | Framer Motion | **Transitions de pages UNIQUEMENT** |
| Auth | OTP SMS (Twilio) + JWT | Access 15min / Refresh 7j / TempToken 10min |
| Cache / RL | Upstash Redis | Rate limiting, compteurs OTP, blacklist JWT |
| Backend | Supabase | PostgreSQL, Storage, Realtime |
| Déploiement | Vercel | Auto-deploy sur push `main` |
| Mobile | React Native / Expo | `apps/mobile/` |

## Structure des dossiers

```
daada-fast-food/                  ← C:\Users\user\Desktop\daada-old
├── src/
│   ├── app/                      # Next.js App Router (source unique de vérité)
│   │   ├── (auth)/               # Pages non protégées
│   │   │   ├── layout.tsx        # Gradient orange → noir + logo
│   │   │   ├── login/            # OTP SMS — PhoneInput +237
│   │   │   ├── verify/           # 6 inputs OTP, auto-submit, countdown
│   │   │   ├── register/         # Profil après OTP, code parrainage, CGU
│   │   │   └── email/            # Email + password (toggle login/register/reset)
│   │   ├── (main)/               # Pages protégées (auth requise)
│   │   │   ├── menu/             # Catalogue avec SWR infinite
│   │   │   ├── orders/           # Historique commandes
│   │   │   ├── cart/             # Panier
│   │   │   └── profile/          # Profil utilisateur
│   │   ├── about/                # Page À propos
│   │   ├── cuisine/              # Recettes
│   │   ├── admin/                # Dashboard admin (rôle requis)
│   │   ├── api/                  # API Routes Next.js
│   │   │   ├── auth/
│   │   │   │   ├── send-otp/     # POST — rate limit 5/h/IP, maskedPhone
│   │   │   │   ├── verify-otp/   # POST — max 3 tentatives Redis
│   │   │   │   ├── complete-profile/ # POST — tempToken + prénom/nom + referral
│   │   │   │   ├── refresh/      # POST — rotation refresh token
│   │   │   │   ├── logout/       # POST — blacklist + clear cookies
│   │   │   │   ├── me/           # GET  — profil depuis token
│   │   │   │   └── email/
│   │   │   │       ├── login/    # POST — Supabase signInWithPassword
│   │   │   │       ├── register/ # POST — bcrypt salt 12 + Supabase signup
│   │   │   │       └── reset/    # POST — email reset silencieux
│   │   │   ├── menu/             # GET /api/menu, GET /api/menu/[id]
│   │   │   ├── orders/           # CRUD commandes
│   │   │   ├── payment/          # Initiation + webhooks MoMo
│   │   │   └── notifications/    # Push FCM
│   │   └── globals.css           # Variables CSS (design tokens)
│   ├── components/
│   │   ├── features/             # Composants métier (Header, BottomNav, CartDrawer…)
│   │   ├── providers/            # Providers React (auth, toast…)
│   │   └── ui/                   # Composants UI locaux
│   ├── hooks/                    # useAuth, useCart, useMenu, useOrders
│   ├── stores/                   # Zustand stores (auth, cart, ui)
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── jwt.ts            # generateAccessToken, generateRefreshToken,
│   │   │   │                     # generateTempToken, verifyTempToken, blacklist Redis
│   │   │   └── permissions.ts    # Helpers rôles
│   │   ├── db/users.ts           # getUser, getUserByTelephone
│   │   ├── middleware/auth.ts    # withAuth(), withRole(), requireAuth()
│   │   ├── security/validation.ts # Zod schemas, normalizeTelephone, safeValidate
│   │   ├── supabase.ts           # createClient / createAdminClient
│   │   └── utils.ts              # cn(), formatPrice(), formatPhoneCM()…
│   ├── services/
│   │   ├── auth/                 # authService, otpService, session, twilio
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── payment/
│   │   ├── delivery/
│   │   └── notifications/
│   ├── stores/
│   │   ├── auth.store.ts         # Session JWT (userDB, accessToken, tokenExpiry)
│   │   ├── cart.store.ts         # Panier persisté
│   │   └── ui.store.ts           # UI state
│   ├── types/                    # Types TypeScript par domaine
│   └── middleware.ts             # Auth guard + rate limit + driver/premium routes
│
├── packages/
│   ├── ui/                       # @daada/ui — Design System complet
│   │   └── src/
│   │       ├── atoms/            # Button, Input, PhoneInput, Badge, Avatar…
│   │       ├── molecules/        # MenuItemCard, CartItem, OrderStatusBadge…
│   │       ├── organisms/        # Navbar, CartDrawer, Modal, ChatbotWidget…
│   │       ├── icons.tsx         # 40+ icônes SVG inline
│   │       ├── tokens.ts         # Design tokens JS
│   │       └── utils.ts          # cn(), formatPrice()…
│   └── shared/
│       └── src/hooks/            # useAuth, useOTP, usePremium (web + mobile)
│
├── apps/
│   └── mobile/
│       └── src/screens/auth/     # LoginScreen, VerifyScreen, RegisterScreen,
│                                 # BiometricReauthScreen (Expo SecureStore + biométrie)
│
├── supabase/
│   └── migrations/               # SQL idempotent (IF NOT EXISTS, CREATE OR REPLACE)
│       ├── 001_schema.sql        # Schéma complet + recettes fusionnés
│       ├── 002_rls.sql           # Row Level Security policies
│       └── 003_functions.sql     # Fonctions PostgreSQL (EXCEPT, pas MINUS)
│
└── .github/workflows/
    ├── ci.yml                    # Lint + typecheck + build (PR + branches)
    └── deploy.yml                # Auto-deploy Vercel sur push main
```

## CI/CD — Déploiement automatique

**Chaque push sur `main` déclenche automatiquement le déploiement.**

```
push main → ci.yml (lint, typecheck, build)
          → deploy.yml :
              vercel pull --environment=production
              vercel build --prod
              vercel deploy --prebuilt --prod
              → daada-web.vercel.app
```

**Secrets GitHub requis** (`Settings → Secrets → Actions`) :

| Secret | Valeur |
|--------|--------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `team_F4vaixOTG1ivcTTIngd1Bthe` |
| `VERCEL_PROJECT_ID` | `prj_UpHD15m4OkvqXIKaoOpjT06rwDqv` |
| `SLACK_WEBHOOK_URL` | Optionnel — notifications |
| `SUPABASE_DB_URL` | Optionnel — migrations auto |

## Flux Auth OTP

```
POST /api/auth/send-otp    → rate limit 5/h/IP (Redis) → Twilio SMS → {maskedPhone}
POST /api/auth/verify-otp  → max 3 tentatives (Redis counter)
  ├── Utilisateur existant → {accessToken, refreshToken, user}
  └── Nouvel utilisateur   → {isNew: true, tempToken (10min)}
POST /api/auth/complete-profile → tempToken + prénom + nom → referral_code → tokens
POST /api/auth/refresh     → rotation refresh token (Redis)
POST /api/auth/logout      → blacklist Redis (TTL 7j)
```

## Flux de commande

```
1. Client parcourt le menu → ajoute au panier (Zustand, persisté)
2. Client passe au checkout → choisit adresse + méthode de paiement
3. POST /api/payment/initiate → crée Payment en DB + appelle MTN/Orange API
4. Client confirme le paiement sur son téléphone
5. Webhook MTN/Orange → POST /api/payment/webhook → update Payment + Order status
6. Realtime Supabase pousse la mise à jour au client
7. Notifications envoyées à chaque changement de statut
```

## Règles importantes

### Framer Motion — Usage STRICT
Framer Motion est **uniquement** autorisé pour les transitions de pages.
- ✅ `<PageTransition>` dans `src/components/ui/page-transition.tsx`
- ❌ Animations de composants individuels → utiliser Tailwind `transition-*`

### Supabase — Jamais directement depuis les composants
```typescript
// ✅ Correct
import { menuService } from '@/services/menu'
import { useCart } from '@/hooks/useCart'

// ❌ Incorrect — appel Supabase direct dans un composant
import { supabase } from '@/lib/supabase'
```

### Auth middleware dans les API routes
```typescript
import { withAuth, withRole } from '@/lib/middleware/auth'

// Route protégée
export const GET = withAuth(async (request, { user }) => { ... })

// Route admin uniquement
export const POST = withRole('admin', 'super_admin')(async (request, { user }) => { ... })
```

### Conventions de nommage
- Services: `camelCase` objet (`menuService.getItems()`)
- Stores: `useAuthStore`, `useCartStore`, `useUIStore`
- Hooks: `useAuth`, `useMenu`, `useCart`, `useOrders`
- Types: `PascalCase` (`MenuItem`, `Order`, `UserDB`)
- Composants: `PascalCase` fichiers (`MenuItemCard.tsx`)
- Alias imports: toujours `@/` (jamais de `../../`)

### Sécurité
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (API routes)
- Validation Zod de tous les inputs (`safeValidate()`)
- Téléphone camerounais : `/^(\+237|237)?(6[5-9]|2[2-3])\d{7}$/`
- Headers de sécurité configurés dans `next.config.js`
- Blacklist JWT via Redis (`jwt:revoked:` prefix)

## Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run format       # Prettier
npm run clean        # Supprimer .next/
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Variables minimales :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=                     # min 32 chars
JWT_REFRESH_SECRET=             # min 32 chars
JWT_TEMP_SECRET=                # min 32 chars
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SERVICE_SID=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
