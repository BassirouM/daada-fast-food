-- =============================================================================
-- DAADA FAST FOOD — Triggers & Fonctions métier
-- Migration : 003_functions.sql
-- =============================================================================

-- =============================================================================
-- 1. AUTO updated_at (déjà défini dans 001, appliqué ici aux tables manquantes)
-- =============================================================================

-- (set_updated_at() créé dans 001_schema.sql)

-- =============================================================================
-- 2. CALCUL AUTOMATIQUE order.total
--    Déclenché sur INSERT / UPDATE / DELETE de order_items
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_order_id UUID;
  v_items_total DECIMAL;
BEGIN
  -- Identifier l'order concerné
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  -- Recalculer items_total
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_items_total
  FROM order_items
  WHERE order_id = v_order_id;

  -- Mettre à jour l'ordre (total = items + delivery - discount - loyalty)
  UPDATE orders
  SET
    items_total = v_items_total,
    total       = v_items_total
                  + delivery_fee
                  - COALESCE(discount, 0)
                  - COALESCE(loyalty_discount, 0),
    updated_at  = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_order_total_recalc
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_order_total();

-- =============================================================================
-- 3. LOG order_status_history à chaque changement de statut
-- =============================================================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_history
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- =============================================================================
-- 4. LOYALTY POINTS après livraison (1 point par 10 FCFA dépensés)
-- =============================================================================

CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_points INT;
BEGIN
  -- Seulement quand on passe à 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    v_points := FLOOR(NEW.total / 10)::INT;

    IF v_points > 0 THEN
      -- Créditer les points
      UPDATE users
      SET loyalty_points = loyalty_points + v_points
      WHERE id = NEW.user_id;

      -- Journaliser la transaction
      INSERT INTO loyalty_transactions (user_id, order_id, points, type, description)
      VALUES (
        NEW.user_id,
        NEW.id,
        v_points,
        'earn',
        'Points gagnés — commande ' || NEW.id::text
      );
    END IF;
  END IF;

  -- Si la commande est annulée et que des points avaient été utilisés, les rembourser
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.loyalty_points_used > 0 THEN
    UPDATE users
    SET loyalty_points = loyalty_points + NEW.loyalty_points_used
    WHERE id = NEW.user_id;

    INSERT INTO loyalty_transactions (user_id, order_id, points, type, description)
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.loyalty_points_used,
      'bonus',
      'Remboursement points — commande annulée'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_loyalty_points
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION award_loyalty_points();

-- =============================================================================
-- 5. DÉCRÉMENTATION stock_count sur commande
-- =============================================================================

CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE menu_items
  SET stock_count = stock_count - NEW.quantity
  WHERE id = NEW.item_id
    AND stock_count IS NOT NULL
    AND stock_count >= NEW.quantity;

  -- Marquer indisponible si stock épuisé
  UPDATE menu_items
  SET is_available = false
  WHERE id = NEW.item_id
    AND stock_count IS NOT NULL
    AND stock_count <= 0;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order();

-- Remettre le stock si commande annulée
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status NOT IN ('cancelled','refunded') THEN
    UPDATE menu_items mi
    SET
      stock_count  = mi.stock_count + oi.quantity,
      is_available = CASE WHEN mi.stock_count + oi.quantity > 0 THEN true ELSE mi.is_available END
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND mi.id = oi.item_id AND mi.stock_count IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION restore_stock_on_cancel();

-- =============================================================================
-- 6. MISE À JOUR avg_rating recettes (défini dans 005_recipes.sql)
-- =============================================================================
-- (voir 005_recipes.sql — trigger trg_recipe_avg_rating)

-- =============================================================================
-- 7. INCRÉMENTATION coupon.used_count
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coupon_usage_count
  AFTER INSERT ON coupon_usages
  FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

-- =============================================================================
-- 8. AUTO-CRÉATION order_status_history à la création d'une commande
-- =============================================================================

CREATE OR REPLACE FUNCTION log_initial_order_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
  VALUES (NEW.id, NULL, NEW.status::text, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initial_order_status
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION log_initial_order_status();

-- =============================================================================
-- 9. SPLIT PAIEMENT automatique (restaurant / plateforme)
--    Déclenché quand un payment passe à 'completed'
-- =============================================================================

CREATE OR REPLACE FUNCTION create_payment_splits()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_commission DECIMAL;
  v_restaurant_share DECIMAL;
  v_platform_share DECIMAL;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Récupérer le taux de commission du restaurant
    SELECT COALESCE(r.commission_rate, 0.10) INTO v_commission
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.id = NEW.order_id;

    v_platform_share   := ROUND(NEW.amount * v_commission, 2);
    v_restaurant_share := NEW.amount - v_platform_share;

    INSERT INTO payment_splits (payment_id, recipient_type, amount, percentage, status)
    VALUES
      (NEW.id, 'restaurant', v_restaurant_share, 1 - v_commission, 'pending'),
      (NEW.id, 'platform',   v_platform_share,   v_commission,     'pending');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_splits
  AFTER UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_payment_splits();

-- =============================================================================
-- 10. PARRAINAGE : récompenser au premier achat
-- =============================================================================

CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_referral referrals%ROWTYPE;
BEGIN
  -- Déclenché quand une commande passe à 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Chercher un parrainage non encore récompensé
    SELECT * INTO v_referral
    FROM referrals
    WHERE referee_id = NEW.user_id
      AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      -- Mettre à jour le parrainage
      UPDATE referrals
      SET status = 'rewarded', first_order_id = NEW.id
      WHERE id = v_referral.id;

      -- Récompenser le parrain (points)
      UPDATE users
      SET loyalty_points = loyalty_points + FLOOR(v_referral.referrer_reward_fcfa / 10)
      WHERE id = v_referral.referrer_id;

      INSERT INTO loyalty_transactions (user_id, points, type, description)
      VALUES (
        v_referral.referrer_id,
        FLOOR(v_referral.referrer_reward_fcfa / 10),
        'bonus',
        'Parrainage — ' || v_referral.referee_id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_referral_reward
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION process_referral_reward();

-- =============================================================================
-- 11. FONCTIONS UTILITAIRES
-- =============================================================================

-- Distance haversine (km) entre deux points GPS
CREATE OR REPLACE FUNCTION haversine_km(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL LANGUAGE sql IMMUTABLE AS $$
  SELECT 6371 * 2 * asin(sqrt(
    sin(radians((lat2 - lat1) / 2)) ^ 2
    + cos(radians(lat1)) * cos(radians(lat2))
    * sin(radians((lng2 - lng1) / 2)) ^ 2
  ))
$$;

-- Restaurants dans un rayon donné
CREATE OR REPLACE FUNCTION restaurants_nearby(
  p_lat DECIMAL, p_lng DECIMAL, p_radius_km DECIMAL DEFAULT 10
)
RETURNS SETOF restaurants LANGUAGE sql STABLE AS $$
  SELECT * FROM restaurants
  WHERE is_active = true
    AND haversine_km(p_lat, p_lng, lat, lng) <= p_radius_km
  ORDER BY haversine_km(p_lat, p_lng, lat, lng)
$$;

-- Épiciers proches (utilisé dans module recettes)
CREATE OR REPLACE FUNCTION grocery_stores_nearby(
  p_lat DECIMAL, p_lng DECIMAL, p_radius_km DECIMAL DEFAULT 3
)
RETURNS SETOF grocery_stores LANGUAGE sql STABLE AS $$
  SELECT * FROM grocery_stores
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND haversine_km(p_lat, p_lng, lat, lng) <= p_radius_km
  ORDER BY haversine_km(p_lat, p_lng, lat, lng)
$$;

-- Vérifier si un user est abonné premium actif
CREATE OR REPLACE FUNCTION is_premium(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
      AND status IN ('trial','active')
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

-- Solde de points fidélité
CREATE OR REPLACE FUNCTION loyalty_balance(p_user_id UUID DEFAULT auth.uid())
RETURNS INT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(points), 0)::INT
  FROM loyalty_transactions
  WHERE user_id = p_user_id
    AND type IN ('earn','bonus')
  EXCEPT
  SELECT COALESCE(SUM(ABS(points)), 0)
  FROM loyalty_transactions
  WHERE user_id = p_user_id AND type IN ('redeem','expire')
$$;
