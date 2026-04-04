-- =============================================================================
-- DAADA FAST FOOD — Row Level Security
-- Migration : 002_rls.sql
-- =============================================================================
-- Rôles :
--   client      → ses données uniquement
--   driver      → commandes assignées + driver_locations
--   admin/owner → toutes les données de son restaurant
--   super_admin → accès total
--   service_role→ bypass RLS (microservices Supabase)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER : rôle courant
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT role = 'super_admin' FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION owns_restaurant(rid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurants
    WHERE id = rid AND owner_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Chacun voit son propre profil ; super_admin voit tout
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid() OR is_super_admin());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_super_admin_all" ON users
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- RESTAURANTS
-- ---------------------------------------------------------------------------

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Lecture publique des restaurants actifs
CREATE POLICY "restaurants_public_read" ON restaurants
  FOR SELECT USING (is_active = true);

-- Owner gère son restaurant, super_admin gère tout
CREATE POLICY "restaurants_owner_all" ON restaurants
  FOR ALL USING (
    owns_restaurant(id) OR is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- ADDRESSES
-- ---------------------------------------------------------------------------

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_own" ON addresses
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "addresses_super_admin" ON addresses
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- DELIVERY ZONES
-- ---------------------------------------------------------------------------

ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_zones_public_read" ON delivery_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "delivery_zones_owner_write" ON delivery_zones
  FOR ALL USING (owns_restaurant(restaurant_id) OR is_super_admin());

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "categories_owner_write" ON categories
  FOR ALL USING (owns_restaurant(restaurant_id) OR is_super_admin());

-- ---------------------------------------------------------------------------
-- MENU ITEMS
-- ---------------------------------------------------------------------------

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "menu_items_owner_write" ON menu_items
  FOR ALL USING (owns_restaurant(restaurant_id) OR is_super_admin());

-- ---------------------------------------------------------------------------
-- ITEM OPTIONS & CHOICES (lecture publique)
-- ---------------------------------------------------------------------------

ALTER TABLE item_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_media     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_options_public"  ON item_options  FOR SELECT USING (true);
CREATE POLICY "option_choices_public" ON option_choices FOR SELECT USING (true);
CREATE POLICY "item_media_public"    ON item_media     FOR SELECT USING (true);

CREATE POLICY "item_options_owner_write" ON item_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM menu_items m WHERE m.id = item_id AND owns_restaurant(m.restaurant_id))
    OR is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Client : ses propres commandes
CREATE POLICY "orders_client_own" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_client_insert" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin/owner : toutes les commandes de son restaurant
CREATE POLICY "orders_restaurant_admin" ON orders
  FOR ALL USING (
    owns_restaurant(restaurant_id) OR is_super_admin()
  );

-- Driver : commandes avec une livraison assignée à lui
CREATE POLICY "orders_driver_assigned" ON orders
  FOR SELECT USING (
    current_user_role() = 'driver'
    AND EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.order_id = id AND d.driver_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------------

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_own_or_admin" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR owns_restaurant(o.restaurant_id) OR is_super_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- ORDER STATUS HISTORY
-- ---------------------------------------------------------------------------

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_status_history_read" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR owns_restaurant(o.restaurant_id) OR is_super_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------------

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_client_read" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND owns_restaurant(o.restaurant_id))
    OR is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- PAYMENT SPLITS & REFUNDS
-- ---------------------------------------------------------------------------

ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_splits_admin" ON payment_splits
  FOR ALL USING (is_super_admin());

CREATE POLICY "refunds_admin" ON refunds
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- DELIVERIES
-- ---------------------------------------------------------------------------

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Client voit ses livraisons
CREATE POLICY "deliveries_client_read" ON deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- Driver voit et met à jour ses propres livraisons
CREATE POLICY "deliveries_driver_own" ON deliveries
  FOR ALL USING (driver_id = auth.uid() OR current_user_role() = 'driver');

-- Admin voit les livraisons de son restaurant
CREATE POLICY "deliveries_admin_read" ON deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND owns_restaurant(o.restaurant_id))
    OR is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- DRIVER LOCATIONS
-- ---------------------------------------------------------------------------

ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Driver écrit ses propres positions
CREATE POLICY "driver_locations_own_write" ON driver_locations
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- Admin et client avec livraison active peuvent lire
CREATE POLICY "driver_locations_admin_read" ON driver_locations
  FOR SELECT USING (
    driver_id = auth.uid()
    OR is_super_admin()
    OR (
      current_user_role() = 'admin'
      AND EXISTS (
        SELECT 1 FROM deliveries d
        JOIN orders o ON o.id = d.order_id
        WHERE d.driver_id = driver_locations.driver_id
          AND owns_restaurant(o.restaurant_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- LOYALTY TRANSACTIONS
-- ---------------------------------------------------------------------------

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_own_read" ON loyalty_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "loyalty_super_admin" ON loyalty_transactions
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- COUPONS
-- ---------------------------------------------------------------------------

ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages  ENABLE ROW LEVEL SECURITY;

-- Lecture publique des coupons actifs
CREATE POLICY "coupons_public_read" ON coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "coupons_owner_write" ON coupons
  FOR ALL USING (
    (restaurant_id IS NULL AND is_super_admin())
    OR owns_restaurant(restaurant_id)
    OR is_super_admin()
  );

CREATE POLICY "coupon_usages_own" ON coupon_usages
  FOR SELECT USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- REFERRALS
-- ---------------------------------------------------------------------------

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_own" ON referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "referrals_super_admin" ON referrals
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- STREAMS
-- ---------------------------------------------------------------------------

ALTER TABLE streams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_messages  ENABLE ROW LEVEL SECURITY;

-- Streams live ou à venir : lecture publique
CREATE POLICY "streams_public_read" ON streams
  FOR SELECT USING (status IN ('live','scheduled'));

CREATE POLICY "streams_owner_write" ON streams
  FOR ALL USING (owns_restaurant(restaurant_id) OR is_super_admin());

-- Réactions et messages : authentifié
CREATE POLICY "stream_reactions_auth" ON stream_reactions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "stream_messages_read"  ON stream_messages
  FOR SELECT USING (is_moderated = false);

CREATE POLICY "stream_messages_write" ON stream_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RESERVATIONS
-- ---------------------------------------------------------------------------

ALTER TABLE reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_own_read" ON reservations
  FOR SELECT USING (user_id = auth.uid() OR owns_restaurant(restaurant_id) OR is_super_admin());

CREATE POLICY "reservations_client_insert" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reservations_admin_write" ON reservations
  FOR UPDATE USING (owns_restaurant(restaurant_id) OR is_super_admin());

CREATE POLICY "reservation_slots_public" ON reservation_slots
  FOR SELECT USING (is_active = true);

-- ---------------------------------------------------------------------------
-- PREMIUM SUBSCRIPTIONS
-- ---------------------------------------------------------------------------

ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium_subs_own" ON premium_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "premium_subs_super_admin" ON premium_subscriptions
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- AI RECOMMENDATIONS
-- ---------------------------------------------------------------------------

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_reco_own" ON ai_recommendations
  FOR SELECT USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- FRAUD SCORES
-- ---------------------------------------------------------------------------

ALTER TABLE fraud_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fraud_scores_super_admin" ON fraud_scores
  FOR ALL USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- PRICE HISTORY
-- ---------------------------------------------------------------------------

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_history_admin_read" ON price_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM menu_items m WHERE m.id = item_id AND owns_restaurant(m.restaurant_id))
    OR is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- SALES FORECASTS
-- ---------------------------------------------------------------------------

ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_forecasts_admin" ON sales_forecasts
  FOR SELECT USING (owns_restaurant(restaurant_id) OR is_super_admin());
