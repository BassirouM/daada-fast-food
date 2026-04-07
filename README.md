# Daada Fast Food

Application de livraison de nourriture — Maroua, Cameroun.

[![CI](https://github.com/BassirouM/daada-fast-food/actions/workflows/ci.yml/badge.svg)](https://github.com/BassirouM/daada-fast-food/actions/workflows/ci.yml)
[![Deploy](https://github.com/BassirouM/daada-fast-food/actions/workflows/deploy.yml/badge.svg)](https://github.com/BassirouM/daada-fast-food/actions/workflows/deploy.yml)

**Production :** [daada-web.vercel.app](https://daada-web.vercel.app)  
**Repo :** [BassirouM/daada-fast-food](https://github.com/BassirouM/daada-fast-food)

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 App Router |
| Langage | TypeScript strict |
| Style | Tailwind CSS |
| Auth | OTP SMS (Twilio) + JWT |
| Base de données | Supabase (PostgreSQL) |
| Cache / Rate limit | Upstash Redis |
| Déploiement | Vercel (auto sur push `main`) |

## Structure

```
daada-fast-food/
├── src/
│   ├── app/               # Pages Next.js (App Router)
│   │   ├── (auth)/        # Login, verify, register, email
│   │   ├── (main)/        # Menu, orders, cart, profile
│   │   ├── admin/         # Dashboard admin
│   │   └── api/           # API routes
│   ├── components/        # Composants React
│   ├── services/          # auth, menu, orders, payment…
│   ├── stores/            # Zustand stores
│   ├── hooks/             # useAuth, useCart…
│   ├── lib/               # supabase, jwt, validation…
│   └── types/             # Types TypeScript
├── packages/
│   ├── ui/                # Design system @daada/ui
│   └── shared/            # Hooks partagés web/mobile
├── apps/
│   └── mobile/            # Écrans React Native / Expo
├── supabase/
│   └── migrations/        # Migrations PostgreSQL
└── .github/workflows/
    ├── ci.yml             # Lint + typecheck + build (PR)
    └── deploy.yml         # Deploy Vercel auto (push main)
```

## Développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Vérifications
npm run lint
npm run type-check

# Build production
npm run build
```

Copier `.env.example` → `.env.local` et remplir les variables avant de démarrer.

## Déploiement

Chaque push sur `main` déclenche automatiquement le workflow `deploy.yml` :

1. `vercel pull` — récupère la config et les env vars depuis Vercel
2. `vercel build --prod` — build Next.js dans l'environnement Vercel
3. `vercel deploy --prebuilt --prod` — publie le build sur la prod

**Secrets GitHub requis** (`Settings → Secrets → Actions`) :

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `team_F4vaixOTG1ivcTTIngd1Bthe` (dans `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | `prj_UpHD15m4OkvqXIKaoOpjT06rwDqv` (dans `.vercel/project.json`) |
| `SLACK_WEBHOOK_URL` | Optionnel — notifications Slack |
| `SUPABASE_DB_URL` | Optionnel — migrations automatiques |

## Auth flow

```
Téléphone → send-otp → SMS Twilio
         ↓
    verify-otp (max 3 tentatives, Redis)
         ↓
  Utilisateur existant → tokens JWT (15 min / 7 j)
  Nouvel utilisateur   → tempToken → complete-profile → tokens
```
