-- =============================================================================
-- DAADA FAST FOOD — Schéma initial complet
-- Migration : 001_initial_schema
-- Base de données : Supabase (PostgreSQL 15)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS — Profils utilisateurs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telephone             TEXT UNIQUE NOT NULL,
  nom                   TEXT NOT NULL,
  quartier              TEXT,
  role                  TEXT NOT NULL DEFAULT 'customer'
                          CHECK (role IN ('customer', 'admin', 'delivery_agent', 'kitchen')),
  avatar_url            TEXT,
  fcm_token             TEXT,
  points_fidelite       INTEGER NOT NULL DEFAULT 0 CHECK (points_fidelite >= 0),
  niveau_fidelite       TEXT NOT NULL DEFAULT 'bronze'
                          CHECK (niveau_fidelite IN ('bronze', 'argent', 'or')),
  adresses_sauvegardees JSONB NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Profils utilisateurs — liés à auth.users Supabase';
COMMENT ON COLUMN public.users.points_fidelite IS 'Points de fidélité accumulés';
COMMENT ON COLUMN public.users.adresses_sauvegardees IS 'JSONB : [{label, quartier, adresse_complete, latitude, longitude}]';

-- =============================================================================
-- MENUS — Catalogue des plats
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.menus (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom               TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  prix              INTEGER NOT NULL CHECK (prix >= 0),  -- en XAF (pas de décimales)
  categorie         TEXT NOT NULL,                       -- 'Burgers', 'Poulet', 'Pizza', etc.
  image_url         TEXT,
  disponible        BOOLEAN NOT NULL DEFAULT true,
  temps_preparation INTEGER NOT NULL DEFAULT 15,         -- en minutes
  note_moyenne      NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (note_moyenne BETWEEN 0 AND 5),
  nb_commandes      INTEGER NOT NULL DEFAULT 0 CHECK (nb_commandes >= 0),
  tags              TEXT[] NOT NULL DEFAULT '{}',        -- ex: ['épicé', 'halal', 'populaire']
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.menus IS 'Catalogue complet des plats disponibles';
COMMENT ON COLUMN public.menus.prix IS 'Prix en Franc CFA (XAF), sans décimales';

-- =============================================================================
-- COMMANDES — Commandes clients
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.commandes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  livreur_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  statut           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (statut IN ('pending','confirmed','preparing','ready','picked_up','delivered','cancelled')),
  adresse_livraison TEXT NOT NULL,
  frais_livraison  INTEGER NOT NULL DEFAULT 0 CHECK (frais_livraison >= 0),
  sous_total       INTEGER NOT NULL CHECK (sous_total >= 0),
  total            INTEGER NOT NULL CHECK (total >= 0),
  note_cuisinier   TEXT,                                 -- instruction spéciale pour le cuisinier
  temps_estime     INTEGER,                              -- durée estimée en minutes
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commandes IS 'Commandes passées par les clients';
COMMENT ON COLUMN public.commandes.statut IS 'pending → confirmed → preparing → ready → picked_up → delivered | cancelled';

-- =============================================================================
-- COMMANDE_ARTICLES — Lignes de commande
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.commande_articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id  UUID NOT NULL REFERENCES public.commandes(id) ON DELETE CASCADE,
  menu_id      UUID NOT NULL REFERENCES public.menus(id) ON DELETE RESTRICT,
  nom          TEXT NOT NULL,         -- snapshot du nom au moment de la commande
  quantite     INTEGER NOT NULL CHECK (quantite > 0),
  prix_unitaire INTEGER NOT NULL CHECK (prix_unitaire >= 0)
);

COMMENT ON TABLE public.commande_articles IS 'Articles individuels par commande (snapshot des prix)';

-- =============================================================================
-- PAIEMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.paiements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id      UUID NOT NULL REFERENCES public.commandes(id) ON DELETE RESTRICT,
  transaction_id   TEXT UNIQUE,                          -- ID retourné par CinetPay
  idempotency_key  TEXT UNIQUE NOT NULL,                 -- clé d'idempotence pour éviter les doublons
  methode          TEXT NOT NULL
                     CHECK (methode IN ('mtn_momo', 'orange_money', 'cinetpay', 'cash')),
  montant          INTEGER NOT NULL CHECK (montant > 0),
  statut           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (statut IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  cinetpay_data    JSONB,                                -- réponse brute CinetPay
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.paiements IS 'Transactions de paiement (CinetPay, MTN MoMo, Orange Money, Espèces)';
COMMENT ON COLUMN public.paiements.idempotency_key IS 'Clé unique pour éviter les doublons lors des retries';

-- =============================================================================
-- POSITIONS_LIVREURS — GPS temps réel
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.positions_livreurs (
  livreur_id  UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  disponible  BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.positions_livreurs IS 'Position GPS en temps réel des livreurs (1 ligne par livreur)';

-- =============================================================================
-- AUDIT_LOG — Journal d'audit
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,            -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', etc.
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Journal immuable de toutes les modifications importantes';

-- =============================================================================
-- NOTIFICATIONS — Notifications in-app
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL,
  corps      TEXT NOT NULL,
  type       TEXT NOT NULL
               CHECK (type IN (
                 'order_confirmed', 'order_preparing', 'order_ready',
                 'order_picked_up', 'order_delivered', 'order_cancelled',
                 'payment_success', 'payment_failed',
                 'promotion', 'system', 'fidelite'
               )),
  lu         BOOLEAN NOT NULL DEFAULT false,
  data       JSONB,                    -- données supplémentaires (order_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Notifications in-app envoyées aux utilisateurs';

-- =============================================================================
-- INDEX
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_menus_categorie     ON public.menus(categorie);
CREATE INDEX IF NOT EXISTS idx_menus_disponible    ON public.menus(disponible);
CREATE INDEX IF NOT EXISTS idx_menus_note          ON public.menus(note_moyenne DESC);
CREATE INDEX IF NOT EXISTS idx_commandes_client    ON public.commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_livreur   ON public.commandes(livreur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut    ON public.commandes(statut);
CREATE INDEX IF NOT EXISTS idx_articles_commande   ON public.commande_articles(commande_id);
CREATE INDEX IF NOT EXISTS idx_paiements_commande  ON public.paiements(commande_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user_lu      ON public.notifications(user_id, lu);
CREATE INDEX IF NOT EXISTS idx_audit_user          ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table         ON public.audit_log(table_name, created_at DESC);

-- =============================================================================
-- TRIGGERS — updated_at automatique
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at     ON public.users;
DROP TRIGGER IF EXISTS commandes_updated_at ON public.commandes;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER commandes_updated_at
  BEFORE UPDATE ON public.commandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER positions_updated_at
  BEFORE UPDATE ON public.positions_livreurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
