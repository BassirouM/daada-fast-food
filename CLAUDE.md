# Daada Fast Food — Architecture Documentation

App de livraison de nourriture à Maroua, Cameroun.

## Stack Technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Framework | Next.js 14 App Router | Routing, SSR, API Routes |
| Langage | TypeScript (strict) | Typage statique |
| Style | Tailwind CSS + shadcn/ui (local) | UI components |
| Fetching | SWR | Data fetching + cache |
| State | Zustand (persist) | State management global |
| Animations | Framer Motion | **Transitions de pages UNIQUEMENT** |
| PWA | next-pwa | App installable |
| Native | Capacitor | iOS & Android wrapper |
| Backend | Supabase | Auth, DB, Storage, Realtime |
| Déploiement | Vercel | Hosting |

## Architecture Microservices

```
src/services/
├── auth/          # Authentification OTP par numéro de téléphone
├── menu/          # Catalogue produits et catégories
├── orders/        # Gestion des commandes + realtime
├── payment/       # MTN MoMo + Orange Money + Cash
├── delivery/      # Zones, adresses, agents de livraison
└── notifications/ # Push FCM + in-app notifications
```

Chaque service expose une API objet (ex: `menuService.getMenuItems()`).
**Ne jamais appeler Supabase directement depuis les composants.** Toujours passer par les services.

## Structure des dossiers

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Routes authentification (non protégées)
│   │   ├── login/          # Page connexion OTP
│   │   └── register/       # Page inscription
│   ├── (main)/             # Routes principales (protégées)
│   │   ├── menu/           # Catalogue menu
│   │   ├── orders/         # Historique commandes
│   │   ├── cart/           # Panier
│   │   └── profile/        # Profil utilisateur
│   └── api/                # API Routes Next.js
│       ├── auth/           # OTP send/verify
│       ├── payment/        # Initiation + webhooks paiement
│       └── notifications/  # Push notifications
├── components/
│   ├── ui/                 # shadcn/ui (copiés localement)
│   └── features/           # Composants métier par feature
│       ├── auth/
│       ├── menu/
│       ├── orders/
│       └── cart/
├── hooks/                  # Custom hooks (useAuth, useMenu, useCart, useOrders)
├── stores/                 # Zustand stores
│   ├── auth.store.ts       # User session
│   ├── cart.store.ts       # Panier (persisté)
│   └── ui.store.ts         # UI state (bottom sheets, tabs)
├── lib/
│   ├── supabase.ts         # Client Supabase (client + admin)
│   ├── utils.ts            # cn(), formatPrice(), formatPhoneCM(), etc.
│   └── api.ts              # apiFetch() helper
├── types/                  # TypeScript types par domaine
│   ├── auth.ts
│   ├── menu.ts
│   ├── orders.ts
│   ├── payment.ts
│   ├── delivery.ts
│   └── notifications.ts
├── services/               # Microservices (voir ci-dessus)
└── middleware.ts            # Auth guard + redirect
```

## Modèle de données Supabase

### Tables principales

- **users** — Profils utilisateurs (phone, name, role, is_verified)
- **menu_categories** — Catégories du menu (name, slug, display_order)
- **menu_items** — Plats (name, price, is_available, is_featured)
- **menu_item_option_groups** — Groupes d'options (ex: "Taille", "Extras")
- **menu_item_options** — Options individuelles (ex: "Grande", "+Fromage")
- **orders** — Commandes (status, timeline JSON, total)
- **order_items** — Lignes de commande avec options choisies
- **payments** — Paiements (method, status, provider_transaction_id)
- **delivery_addresses** — Adresses de livraison (quartier, coordinates)
- **delivery_zones** — Zones de livraison avec tarifs
- **notifications** — Notifications in-app
- **push_tokens** — Tokens FCM par utilisateur

### Realtime Subscriptions

- `orders:id=eq.{orderId}` — Suivi temps réel de commande
- `payments:id=eq.{paymentId}` — Confirmation paiement
- `notifications:user_id=eq.{userId}` — Notifications en temps réel

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

## Paiement Mobile Money

### MTN MoMo
- Sandbox: `https://sandbox.momodeveloper.mtn.com`
- Flow: Crée APIUser → Crée APIKey → RequestToPay → Poll status

### Orange Money Cameroun
- Flow: OAuth2 → Web Payment → Webhook confirmation

### Détection automatique du provider
```typescript
import { detectMomoProvider } from '@/lib/utils'
detectMomoProvider('677000000') // => 'mtn'
detectMomoProvider('695000000') // => 'orange'
```

## Thème Daada

| Variable | Valeur | Usage |
|---------|--------|-------|
| `brand-orange` | `#FF6B00` | Couleur principale, CTAs |
| `brand-black` | `#0A0A0A` | Fond principal dark |
| `brand-orange-dark` | `#CC5500` | Hover states |
| `brand-cream` | `#FFF8F3` | Fond light |

## Règles importantes

### Framer Motion — Usage STRICT
Framer Motion est **uniquement** autorisé pour les transitions de pages.
- ✅ `<PageTransition>` dans `src/components/ui/page-transition.tsx`
- ❌ Animations de composants individuels (utiliser Tailwind `transition-*`)

### Sécurité
- Variables `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (API routes)
- Validation des inputs téléphone camerounais dans `/api/auth/otp/send`
- CORS limité au domaine de production dans `next.config.js`
- Headers de sécurité configurés (CSP, HSTS, X-Frame-Options, etc.)

### Convention de nommage
- Services: `camelCase` objet (ex: `menuService.getItems()`)
- Stores Zustand: `useAuthStore`, `useCartStore`, `useUIStore`
- Hooks: `useAuth`, `useMenu`, `useCart`, `useOrders`
- Types: `PascalCase` (ex: `MenuItem`, `Order`, `PaymentMethod`)
- Composants: `PascalCase` fichiers (ex: `MenuItemCard.tsx`)

### Imports — Utiliser les alias `@/`
```typescript
// ✅ Correct
import { menuService } from '@/services/menu'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'

// ❌ Incorrect
import { menuService } from '../../services/menu'
```

## Commandes utiles

```bash
# Développement
npm run dev

# Vérifications
npm run typecheck
npm run lint
npm run format

# Build
npm run build

# Capacitor — après build Next.js en mode static (output: 'export')
npx cap sync
npx cap open ios
npx cap open android
```

## Variables d'environnement requises

Voir `.env.example` pour la liste complète. Variables minimales pour démarrer :

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): lint + typecheck + build sur chaque PR
- **Deploy** (`.github/workflows/deploy.yml`): déploiement Vercel automatique sur `main`

Secrets GitHub requis: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
