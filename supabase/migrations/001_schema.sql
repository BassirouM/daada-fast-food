-- =============================================================================
-- DAADA FAST FOOD — Schéma PostgreSQL complet multi-tenant
-- Migration : 001_schema.sql
-- Base : Supabase (PostgreSQL 15)
-- Fuseau : Africa/Douala (UTC+1) | Monnaie : XAF (FCFA)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role         AS ENUM ('client','admin','super_admin','driver','owner');
CREATE TYPE order_status      AS ENUM ('pending','confirmed','preparing','ready','delivering','delivered','cancelled','refunded');
CREATE TYPE payment_method    AS ENUM ('mtn','orange','cash');
CREATE TYPE payment_status    AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE payment_provider  AS ENUM ('cinetpay','cash');
CREATE TYPE payment_txn_status AS ENUM ('pending','processing','completed','failed','refunded');
CREATE TYPE delivery_status   AS ENUM ('unassigned','assigned','picked_up','delivered');
CREATE TYPE option_type       AS ENUM ('single','multiple');
CREATE TYPE media_type        AS ENUM ('image','video_360','video_short');
CREATE TYPE loyalty_type      AS ENUM ('earn','redeem','expire','bonus');
CREATE TYPE discount_type     AS ENUM ('percent','fixed');
CREATE TYPE stream_status     AS ENUM ('scheduled','live','ended');
CREATE TYPE reservation_status AS ENUM ('pending','confirmed','cancelled','completed');
CREATE TYPE recipe_difficulty AS ENUM ('facile','moyen','difficile');
CREATE TYPE store_type        AS ENUM ('epicerie','marche','supermarche','grossiste','producteur');
CREATE TYPE subscription_plan AS ENUM ('monthly','quarterly','yearly');
CREATE TYPE sub_status        AS ENUM ('trial','active','expired','cancelled');
CREATE TYPE fraud_action      AS ENUM ('none','hold','block');
CREATE TYPE referral_status   AS ENUM ('pending','rewarded');
CREATE TYPE split_recipient   AS ENUM ('restaurant','platform');
CREATE TYPE refund_status     AS ENUM ('pending','processed','failed');

-- =============================================================================
-- HELPER : updated_at auto-trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- CORE : RESTAURANTS
-- =============================================================================

CREATE TABLE restaurants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(120) NOT NULL,
  owner_id            UUID,                             -- FK → users (créé après)
  slug                VARCHAR(80)  UNIQUE NOT NULL,
  logo_url            TEXT,
  address             TEXT,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  delivery_radius_km  DECIMAL(5,2) DEFAULT 5,
  commission_rate     DECIMAL(5,4) DEFAULT 0.10,        -- 10 %
  is_active           BOOLEAN DEFAULT true,
  settings            JSONB DEFAULT '{}',
  opening_hours       JSONB DEFAULT '{}',               -- {"mon":{"open":"08:00","close":"22:00"}, ...}
  phone               VARCHAR(20),
  whatsapp            VARCHAR(20),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_restaurants_owner    ON restaurants(owner_id);
CREATE INDEX idx_restaurants_slug     ON restaurants(slug);
CREATE INDEX idx_restaurants_active   ON restaurants(is_active);

-- =============================================================================
-- CORE : USERS
-- =============================================================================

CREATE TABLE users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               VARCHAR(20) UNIQUE NOT NULL,
  email               VARCHAR(120),
  full_name           VARCHAR(120),
  avatar_url          TEXT,
  role                user_role DEFAULT 'client',
  loyalty_points      INT DEFAULT 0,
  referral_code       VARCHAR(12) UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  referred_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  device_fingerprint  VARCHAR(64),
  is_blocked          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_users_phone    ON users(phone);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_referral ON users(referral_code);

-- FK deferred pour restaurants.owner_id
ALTER TABLE restaurants
  ADD CONSTRAINT fk_restaurants_owner
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================================================
-- CORE : ADDRESSES
-- =============================================================================

CREATE TABLE addresses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label          VARCHAR(60),
  quartier       VARCHAR(80),
  address_detail TEXT,
  landmark       TEXT,
  lat            DECIMAL(10,7),
  lng            DECIMAL(10,7),
  is_default     BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- =============================================================================
-- CORE : DELIVERY ZONES
-- =============================================================================

CREATE TABLE delivery_zones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           VARCHAR(80) NOT NULL,
  quartiers      TEXT[] DEFAULT '{}',
  geojson        JSONB,
  delivery_fee   DECIMAL(10,2) DEFAULT 500,
  min_order      DECIMAL(10,2) DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_zones_restaurant ON delivery_zones(restaurant_id);

-- =============================================================================
-- MENU : CATEGORIES
-- =============================================================================

CREATE TABLE categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_fr        VARCHAR(80) NOT NULL,
  name_en        VARCHAR(80),
  slug           VARCHAR(80) NOT NULL,
  icon           VARCHAR(10),
  position       INT DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, slug)
);

CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);

-- =============================================================================
-- MENU : MENU ITEMS
-- =============================================================================

CREATE TABLE menu_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id           UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
  name_fr                 VARCHAR(120) NOT NULL,
  name_en                 VARCHAR(120),
  description_fr          TEXT,
  description_en          TEXT,
  price                   DECIMAL(10,2) NOT NULL,
  compare_price           DECIMAL(10,2),
  image_url               TEXT,
  is_available            BOOLEAN DEFAULT true,
  is_featured             BOOLEAN DEFAULT false,
  prep_time_min           INT DEFAULT 15,
  allergens               TEXT[] DEFAULT '{}',
  tags                    TEXT[] DEFAULT '{}',
  nutritional_info        JSONB DEFAULT '{}',
  stock_count             INT,
  dynamic_price_enabled   BOOLEAN DEFAULT false,
  current_price           DECIMAL(10,2),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category   ON menu_items(category_id);
CREATE INDEX idx_menu_items_available  ON menu_items(is_available);
CREATE INDEX idx_menu_items_featured   ON menu_items(is_featured);

-- =============================================================================
-- MENU : ITEM OPTIONS & CHOICES
-- =============================================================================

CREATE TABLE item_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name_fr    VARCHAR(80) NOT NULL,
  name_en    VARCHAR(80),
  type       option_type DEFAULT 'single',
  required   BOOLEAN DEFAULT false,
  position   INT DEFAULT 0
);

CREATE INDEX idx_item_options_item ON item_options(item_id);

CREATE TABLE option_choices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id    UUID NOT NULL REFERENCES item_options(id) ON DELETE CASCADE,
  name_fr      VARCHAR(80) NOT NULL,
  name_en      VARCHAR(80),
  price_extra  DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true
);

CREATE INDEX idx_option_choices_option ON option_choices(option_id);

-- =============================================================================
-- MENU : ITEM MEDIA
-- =============================================================================

CREATE TABLE item_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  type       media_type DEFAULT 'image',
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_item_media_item ON item_media(item_id);

-- =============================================================================
-- COMMANDES : ORDERS
-- =============================================================================

CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id         UUID NOT NULL REFERENCES restaurants(id),
  user_id               UUID NOT NULL REFERENCES users(id),
  status                order_status DEFAULT 'pending',
  items_total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee          DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount              DECIMAL(10,2) DEFAULT 0,
  loyalty_discount      DECIMAL(10,2) DEFAULT 0,
  total                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method        payment_method NOT NULL,
  payment_status        payment_status DEFAULT 'pending',
  delivery_address_id   UUID REFERENCES addresses(id) ON DELETE SET NULL,
  notes                 TEXT,
  coupon_id             UUID,                           -- FK → coupons (créé après)
  loyalty_points_used   INT DEFAULT 0,
  estimated_ready_at    TIMESTAMPTZ,
  estimated_delivery_at TIMESTAMPTZ,
  fraud_score           INT DEFAULT 0,
  idempotency_key       VARCHAR(64) UNIQUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_user       ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_payment    ON orders(payment_status);
CREATE INDEX idx_orders_created    ON orders(created_at DESC);

-- =============================================================================
-- COMMANDES : ORDER ITEMS
-- =============================================================================

CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id        UUID NOT NULL REFERENCES menu_items(id),
  quantity       INT NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL,
  options_chosen JSONB DEFAULT '{}',
  subtotal       DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_item  ON order_items(item_id);

-- =============================================================================
-- COMMANDES : ORDER STATUS HISTORY
-- =============================================================================

CREATE TABLE order_status_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  VARCHAR(20),
  to_status    VARCHAR(20) NOT NULL,
  changed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- =============================================================================
-- PAIEMENT : PAYMENTS
-- =============================================================================

CREATE TABLE payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id),
  provider             payment_provider NOT NULL,
  transaction_id       VARCHAR(120),
  amount               DECIMAL(10,2) NOT NULL,
  currency             VARCHAR(3) DEFAULT 'XAF',
  status               payment_txn_status DEFAULT 'pending',
  cinetpay_metadata    JSONB DEFAULT '{}',
  webhook_received_at  TIMESTAMPTZ,
  idempotency_key      VARCHAR(64) UNIQUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order  ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_txn    ON payments(transaction_id);

-- =============================================================================
-- PAIEMENT : PAYMENT SPLITS
-- =============================================================================

CREATE TABLE payment_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  recipient_type  split_recipient NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  percentage      DECIMAL(5,4),
  status          VARCHAR(20) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_splits_payment ON payment_splits(payment_id);

-- =============================================================================
-- PAIEMENT : REFUNDS
-- =============================================================================

CREATE TABLE refunds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID NOT NULL REFERENCES payments(id),
  amount        DECIMAL(10,2) NOT NULL,
  reason        TEXT,
  status        refund_status DEFAULT 'pending',
  processed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);

-- =============================================================================
-- LIVRAISON : DELIVERIES
-- =============================================================================

CREATE TABLE deliveries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id),
  driver_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  status       delivery_status DEFAULT 'unassigned',
  pickup_at    TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  distance_km  DECIMAL(6,2),
  duration_min INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_order  ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- =============================================================================
-- LIVRAISON : DRIVER LOCATIONS
-- =============================================================================

CREATE TABLE driver_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  heading     DECIMAL(5,2),
  speed       DECIMAL(6,2),
  accuracy    DECIMAL(6,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_locations_driver  ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_order   ON driver_locations(order_id);
CREATE INDEX idx_driver_locations_time    ON driver_locations(recorded_at DESC);

-- =============================================================================
-- LIVRAISON : DELIVERY ROUTES
-- =============================================================================

CREATE TABLE delivery_routes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id    UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  route_geojson  JSONB,
  distance_m     INT,
  duration_s     INT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_routes_delivery ON delivery_routes(delivery_id);

-- =============================================================================
-- FIDÉLITÉ : LOYALTY TRANSACTIONS
-- =============================================================================

CREATE TABLE loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  points      INT NOT NULL,
  type        loyalty_type NOT NULL,
  description VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_user  ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_order ON loyalty_transactions(order_id);

-- =============================================================================
-- MARKETING : COUPONS
-- =============================================================================

CREATE TABLE coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  code           VARCHAR(20) UNIQUE NOT NULL,
  discount_type  discount_type NOT NULL,
  value          DECIMAL(10,2) NOT NULL,
  min_order      DECIMAL(10,2) DEFAULT 0,
  max_uses       INT,
  used_count     INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code   ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);

-- FK coupons → orders (deferred)
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_coupon
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

CREATE TABLE coupon_usages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user   ON coupon_usages(user_id);

-- =============================================================================
-- MARKETING : REFERRALS
-- =============================================================================

CREATE TABLE referrals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status               referral_status DEFAULT 'pending',
  first_order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  referrer_reward_fcfa INT DEFAULT 500,
  referee_discount_fcfa INT DEFAULT 500,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee  ON referrals(referee_id);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_fr  VARCHAR(120),
  title_en  VARCHAR(120),
  body_fr   TEXT,
  body_en   TEXT,
  type      VARCHAR(50),
  data      JSONB DEFAULT '{}',
  read_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id) WHERE read_at IS NULL;

-- =============================================================================
-- STREAMING
-- =============================================================================

CREATE TABLE streams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  status           stream_status DEFAULT 'scheduled',
  mux_stream_id    VARCHAR(120),
  mux_playback_id  VARCHAR(120),
  rtmp_key         VARCHAR(120),
  thumbnail_url    TEXT,
  viewers_count    INT DEFAULT 0,
  scheduled_at     TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streams_restaurant ON streams(restaurant_id);
CREATE INDEX idx_streams_status     ON streams(status);

CREATE TABLE stream_reactions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji     VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stream_reactions_stream ON stream_reactions(stream_id);

CREATE TABLE stream_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id     UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_moderated  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stream_messages_stream ON stream_messages(stream_id);

-- =============================================================================
-- RÉSERVATIONS
-- =============================================================================

CREATE TABLE reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  time_slot       TIME NOT NULL,
  guests_count    INT NOT NULL CHECK (guests_count > 0),
  status          reservation_status DEFAULT 'pending',
  special_note    TEXT,
  confirmed_at    TIMESTAMPTZ,
  reminder_sent   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_reservations_user       ON reservations(user_id);
CREATE INDEX idx_reservations_date       ON reservations(date);

CREATE TABLE reservation_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time          TIME NOT NULL,
  max_guests    INT NOT NULL,
  is_active     BOOLEAN DEFAULT true
);

-- =============================================================================
-- IA & ANALYTICS
-- =============================================================================

CREATE TABLE premium_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            subscription_plan NOT NULL,
  status          sub_status DEFAULT 'trial',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  trial_ends_at   TIMESTAMPTZ,
  payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
  auto_renew      BOOLEAN DEFAULT true
);

CREATE INDEX idx_premium_subs_user   ON premium_subscriptions(user_id);
CREATE INDEX idx_premium_subs_status ON premium_subscriptions(status);

CREATE TABLE ai_recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_ids      UUID[] NOT NULL,
  explanation   TEXT,
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id);

CREATE TABLE fraud_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  score         INT NOT NULL,
  signals       JSONB DEFAULT '{}',
  action_taken  fraud_action DEFAULT 'none',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_scores_order ON fraud_scores(order_id);
CREATE INDEX idx_fraud_scores_user  ON fraud_scores(user_id);

CREATE TABLE price_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  old_price    DECIMAL(10,2) NOT NULL,
  new_price    DECIMAL(10,2) NOT NULL,
  reason       VARCHAR(200),
  changed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_item ON price_history(item_id);

CREATE TABLE sales_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  forecast_date     DATE NOT NULL,
  predicted_orders  INT,
  predicted_revenue DECIMAL(12,2),
  confidence        DECIMAL(5,4),
  factors           JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_forecasts_restaurant ON sales_forecasts(restaurant_id);
CREATE INDEX idx_sales_forecasts_date       ON sales_forecasts(forecast_date);
