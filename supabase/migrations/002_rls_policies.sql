-- =============================================================================
-- DAADA FAST FOOD — Row Level Security (RLS) complet
-- Migration : 002_rls_policies
-- =============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande_articles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions_livreurs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;

-- Forcer RLS même pour les propriétaires de tables (sécurité maximale)
ALTER TABLE public.users             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.commandes         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.paiements         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION — Récupère le rôle de l'utilisateur courant
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- =============================================================================
-- USERS
-- Chaque utilisateur voit uniquement son propre profil.
-- Les admins voient tous les profils.
-- =============================================================================
DROP POLICY IF EXISTS "users_select_own"   ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_own"   ON public.users;
DROP POLICY IF EXISTS "users_update_own"   ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin');

-- =============================================================================
-- MENUS
-- Lecture publique pour tous (même non authentifiés).
-- Écriture réservée aux admins uniquement.
-- =============================================================================
DROP POLICY IF EXISTS "menus_select_public"  ON public.menus;
DROP POLICY IF EXISTS "menus_insert_admin"   ON public.menus;
DROP POLICY IF EXISTS "menus_update_admin"   ON public.menus;
DROP POLICY IF EXISTS "menus_delete_admin"   ON public.menus;

CREATE POLICY "menus_select_public" ON public.menus
  FOR SELECT
  USING (true);  -- lecture publique, même sans authentification

CREATE POLICY "menus_insert_admin" ON public.menus
  FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "menus_update_admin" ON public.menus
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "menus_delete_admin" ON public.menus
  FOR DELETE
  USING (public.get_current_user_role() = 'admin');

-- =============================================================================
-- COMMANDES
-- Le client voit uniquement ses commandes.
-- Le livreur voit les commandes qui lui sont assignées.
-- L'admin et la cuisine voient toutes les commandes.
-- =============================================================================
DROP POLICY IF EXISTS "commandes_select_client"   ON public.commandes;
DROP POLICY IF EXISTS "commandes_select_livreur"  ON public.commandes;
DROP POLICY IF EXISTS "commandes_select_staff"    ON public.commandes;
DROP POLICY IF EXISTS "commandes_insert_client"   ON public.commandes;
DROP POLICY IF EXISTS "commandes_update_client"   ON public.commandes;
DROP POLICY IF EXISTS "commandes_update_staff"    ON public.commandes;

CREATE POLICY "commandes_select_client" ON public.commandes
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "commandes_select_livreur" ON public.commandes
  FOR SELECT
  USING (auth.uid() = livreur_id);

CREATE POLICY "commandes_select_staff" ON public.commandes
  FOR SELECT
  USING (public.get_current_user_role() IN ('admin', 'kitchen'));

CREATE POLICY "commandes_insert_client" ON public.commandes
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Le client peut annuler sa commande (statut → 'cancelled')
CREATE POLICY "commandes_update_client" ON public.commandes
  FOR UPDATE
  USING (auth.uid() = client_id AND statut = 'pending');

-- Admin, cuisine et livreur peuvent mettre à jour le statut
CREATE POLICY "commandes_update_staff" ON public.commandes
  FOR UPDATE
  USING (public.get_current_user_role() IN ('admin', 'kitchen', 'delivery_agent'));

-- =============================================================================
-- COMMANDE_ARTICLES
-- Visibles aux mêmes règles que les commandes parentes.
-- =============================================================================
DROP POLICY IF EXISTS "articles_select_client"  ON public.commande_articles;
DROP POLICY IF EXISTS "articles_select_staff"   ON public.commande_articles;
DROP POLICY IF EXISTS "articles_insert_client"  ON public.commande_articles;

CREATE POLICY "articles_select_client" ON public.commande_articles
  FOR SELECT
  USING (
    commande_id IN (
      SELECT id FROM public.commandes WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "articles_select_staff" ON public.commande_articles
  FOR SELECT
  USING (public.get_current_user_role() IN ('admin', 'kitchen', 'delivery_agent'));

CREATE POLICY "articles_insert_client" ON public.commande_articles
  FOR INSERT
  WITH CHECK (
    commande_id IN (
      SELECT id FROM public.commandes WHERE client_id = auth.uid()
    )
  );

-- =============================================================================
-- PAIEMENTS
-- Le client voit ses propres paiements.
-- L'admin voit tous les paiements.
-- =============================================================================
DROP POLICY IF EXISTS "paiements_select_client" ON public.paiements;
DROP POLICY IF EXISTS "paiements_select_admin"  ON public.paiements;
DROP POLICY IF EXISTS "paiements_insert_client" ON public.paiements;
DROP POLICY IF EXISTS "paiements_update_admin"  ON public.paiements;

CREATE POLICY "paiements_select_client" ON public.paiements
  FOR SELECT
  USING (
    commande_id IN (
      SELECT id FROM public.commandes WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "paiements_select_admin" ON public.paiements
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "paiements_insert_client" ON public.paiements
  FOR INSERT
  WITH CHECK (
    commande_id IN (
      SELECT id FROM public.commandes WHERE client_id = auth.uid()
    )
  );

-- Seul l'admin peut mettre à jour les paiements (webhooks via service role)
CREATE POLICY "paiements_update_admin" ON public.paiements
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin');

-- =============================================================================
-- POSITIONS_LIVREURS
-- Chaque livreur gère sa propre position.
-- Les clients peuvent voir les positions (pour le suivi en temps réel).
-- =============================================================================
DROP POLICY IF EXISTS "positions_select_all"     ON public.positions_livreurs;
DROP POLICY IF EXISTS "positions_upsert_livreur" ON public.positions_livreurs;

CREATE POLICY "positions_select_all" ON public.positions_livreurs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);  -- utilisateur authentifié

CREATE POLICY "positions_upsert_livreur" ON public.positions_livreurs
  FOR ALL
  USING (auth.uid() = livreur_id)
  WITH CHECK (auth.uid() = livreur_id);

-- =============================================================================
-- AUDIT_LOG
-- Lecture uniquement pour les admins.
-- Insertion via service role (triggers, API routes).
-- =============================================================================
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_log;

CREATE POLICY "audit_select_admin" ON public.audit_log
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- =============================================================================
-- NOTIFICATIONS
-- Chaque utilisateur voit et gère uniquement ses propres notifications.
-- =============================================================================
DROP POLICY IF EXISTS "notifs_all_own" ON public.notifications;

CREATE POLICY "notifs_all_own" ON public.notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
