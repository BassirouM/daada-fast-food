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

CREATE TABLE IF NOT EXISTS restaurants (
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

DROP TRIGGER IF EXISTS trg_restaurants_updated_at ON restaurants;
CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_restaurants_owner    ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug     ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_active   ON restaurants(is_active);

-- =============================================================================
-- CORE : USERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
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

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_phone    ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);

-- FK deferred pour restaurants.owner_id
ALTER TABLE restaurants
  ADD CONSTRAINT fk_restaurants_owner
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================================================
-- CORE : ADDRESSES
-- =============================================================================

CREATE TABLE IF NOT EXISTS addresses (
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

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- =============================================================================
-- CORE : DELIVERY ZONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS delivery_zones (
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

CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant ON delivery_zones(restaurant_id);

-- =============================================================================
-- MENU : CATEGORIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS categories (
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

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

-- =============================================================================
-- MENU : MENU ITEMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS menu_items (
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

DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON menu_items;
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category   ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available  ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured   ON menu_items(is_featured);

-- =============================================================================
-- MENU : ITEM OPTIONS & CHOICES
-- =============================================================================

CREATE TABLE IF NOT EXISTS item_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name_fr    VARCHAR(80) NOT NULL,
  name_en    VARCHAR(80),
  type       option_type DEFAULT 'single',
  required   BOOLEAN DEFAULT false,
  position   INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_item_options_item ON item_options(item_id);

CREATE TABLE IF NOT EXISTS option_choices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id    UUID NOT NULL REFERENCES item_options(id) ON DELETE CASCADE,
  name_fr      VARCHAR(80) NOT NULL,
  name_en      VARCHAR(80),
  price_extra  DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_option_choices_option ON option_choices(option_id);

-- =============================================================================
-- MENU : ITEM MEDIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS item_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  type       media_type DEFAULT 'image',
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_media_item ON item_media(item_id);

-- =============================================================================
-- COMMANDES : ORDERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS orders (
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

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment    ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders(created_at DESC);

-- =============================================================================
-- COMMANDES : ORDER ITEMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id        UUID NOT NULL REFERENCES menu_items(id),
  quantity       INT NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL,
  options_chosen JSONB DEFAULT '{}',
  subtotal       DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item  ON order_items(item_id);

-- =============================================================================
-- COMMANDES : ORDER STATUS HISTORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  VARCHAR(20),
  to_status    VARCHAR(20) NOT NULL,
  changed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- =============================================================================
-- PAIEMENT : PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
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

CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_txn    ON payments(transaction_id);

-- =============================================================================
-- PAIEMENT : PAYMENT SPLITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  recipient_type  split_recipient NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  percentage      DECIMAL(5,4),
  status          VARCHAR(20) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_splits_payment ON payment_splits(payment_id);

-- =============================================================================
-- PAIEMENT : REFUNDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS refunds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID NOT NULL REFERENCES payments(id),
  amount        DECIMAL(10,2) NOT NULL,
  reason        TEXT,
  status        refund_status DEFAULT 'pending',
  processed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);

-- =============================================================================
-- LIVRAISON : DELIVERIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS deliveries (
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

CREATE INDEX IF NOT EXISTS idx_deliveries_order  ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- =============================================================================
-- LIVRAISON : DRIVER LOCATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS driver_locations (
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

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver  ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_order   ON driver_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_time    ON driver_locations(recorded_at DESC);

-- =============================================================================
-- LIVRAISON : DELIVERY ROUTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS delivery_routes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id    UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  route_geojson  JSONB,
  distance_m     INT,
  duration_s     INT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_delivery ON delivery_routes(delivery_id);

-- =============================================================================
-- FIDÉLITÉ : LOYALTY TRANSACTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  points      INT NOT NULL,
  type        loyalty_type NOT NULL,
  description VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_user  ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_order ON loyalty_transactions(order_id);

-- =============================================================================
-- MARKETING : COUPONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS coupons (
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

CREATE INDEX IF NOT EXISTS idx_coupons_code   ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- FK coupons → orders (deferred)
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_coupon
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS coupon_usages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user   ON coupon_usages(user_id);

-- =============================================================================
-- MARKETING : REFERRALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                referral_status DEFAULT 'pending',
  first_order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  referrer_reward_fcfa  INT DEFAULT 500,
  referee_discount_fcfa INT DEFAULT 500,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee  ON referrals(referee_id);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_fr   VARCHAR(120),
  title_en   VARCHAR(120),
  body_fr    TEXT,
  body_en    TEXT,
  type       VARCHAR(50),
  data       JSONB DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- =============================================================================
-- STREAMING
-- =============================================================================

CREATE TABLE IF NOT EXISTS streams (
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

CREATE INDEX IF NOT EXISTS idx_streams_restaurant ON streams(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_streams_status     ON streams(status);

CREATE TABLE IF NOT EXISTS stream_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id  UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_reactions_stream ON stream_reactions(stream_id);

CREATE TABLE IF NOT EXISTS stream_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id     UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_moderated  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_messages_stream ON stream_messages(stream_id);

-- =============================================================================
-- RÉSERVATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS reservations (
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

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user       ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date       ON reservations(date);

CREATE TABLE IF NOT EXISTS reservation_slots (
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

CREATE TABLE IF NOT EXISTS premium_subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_premium_subs_user   ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subs_status ON premium_subscriptions(status);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_ids     UUID[] NOT NULL,
  explanation  TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);

CREATE TABLE IF NOT EXISTS fraud_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  score         INT NOT NULL,
  signals       JSONB DEFAULT '{}',
  action_taken  fraud_action DEFAULT 'none',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_scores_order ON fraud_scores(order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_user  ON fraud_scores(user_id);

CREATE TABLE IF NOT EXISTS price_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  old_price   DECIMAL(10,2) NOT NULL,
  new_price   DECIMAL(10,2) NOT NULL,
  reason      VARCHAR(200),
  changed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(item_id);

CREATE TABLE IF NOT EXISTS sales_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  forecast_date     DATE NOT NULL,
  predicted_orders  INT,
  predicted_revenue DECIMAL(12,2),
  confidence        DECIMAL(5,4),
  factors           JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_forecasts_restaurant ON sales_forecasts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_date       ON sales_forecasts(forecast_date);

-- =============================================================================
-- MODULE RECETTES & ÉPICIERS (fusionné depuis 005_recipes.sql)
-- =============================================================================

-- =============================================================================
-- RECETTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  menu_item_id     UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  title_fr         VARCHAR(200) NOT NULL,
  title_en         VARCHAR(200),
  description_fr   TEXT,
  description_en   TEXT,
  cover_image_url  TEXT,
  video_url        TEXT,
  difficulty       recipe_difficulty DEFAULT 'moyen',
  prep_time_min    INT DEFAULT 30,
  cook_time_min    INT DEFAULT 30,
  rest_time_min    INT DEFAULT 0,
  servings_default INT DEFAULT 4,
  cuisine_type     VARCHAR(60) DEFAULT 'Camerounaise',
  tags             TEXT[] DEFAULT '{}',
  is_premium       BOOLEAN DEFAULT true,
  is_published     BOOLEAN DEFAULT false,
  avg_rating       DECIMAL(3,2) DEFAULT 0,
  ratings_count    INT DEFAULT 0,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON recipes;
CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_recipes_restaurant ON recipes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_premium    ON recipes(is_premium);
CREATE INDEX IF NOT EXISTS idx_recipes_published  ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);

-- =============================================================================
-- INGRÉDIENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id        UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name_fr          VARCHAR(120) NOT NULL,
  name_en          VARCHAR(120),
  quantity         DECIMAL(10,3),
  unit             VARCHAR(30),
  is_optional      BOOLEAN DEFAULT false,
  substitutes      TEXT[] DEFAULT '{}',
  market_category  VARCHAR(80),
  position         INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- =============================================================================
-- ÉTAPES
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipe_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position        INT NOT NULL,
  title_fr        VARCHAR(200),
  title_en        VARCHAR(200),
  instruction_fr  TEXT NOT NULL,
  instruction_en  TEXT,
  image_url       TEXT,
  video_url       TEXT,
  timer_seconds   INT,
  chef_tip_fr     TEXT,
  chef_tip_en     TEXT,
  is_premium      BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- =============================================================================
-- ÉPICIERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS grocery_stores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(120) NOT NULL,
  type           store_type DEFAULT 'epicerie',
  city           VARCHAR(60) DEFAULT 'Maroua',
  quartier       VARCHAR(80),
  address_detail TEXT,
  lat            DECIMAL(10,7),
  lng            DECIMAL(10,7),
  phone          VARCHAR(20),
  whatsapp       VARCHAR(20),
  opening_hours  JSONB DEFAULT '{}',
  specialties    TEXT[] DEFAULT '{}',
  photo_url      TEXT,
  is_verified    BOOLEAN DEFAULT false,
  is_partner     BOOLEAN DEFAULT false,
  rating         DECIMAL(3,2),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_stores_type     ON grocery_stores(type);
CREATE INDEX IF NOT EXISTS idx_grocery_stores_quartier ON grocery_stores(quartier);
CREATE INDEX IF NOT EXISTS idx_grocery_stores_partner  ON grocery_stores(is_partner);

-- =============================================================================
-- PRIX INGRÉDIENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS ingredient_prices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name  VARCHAR(120) NOT NULL,
  grocery_store_id UUID NOT NULL REFERENCES grocery_stores(id) ON DELETE CASCADE,
  price_fcfa       DECIMAL(10,2) NOT NULL,
  unit             VARCHAR(30) NOT NULL,
  price_date       DATE DEFAULT CURRENT_DATE,
  notes            TEXT,
  reported_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  is_verified      BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_prices_store      ON ingredient_prices(grocery_store_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_ingredient ON ingredient_prices(ingredient_name);
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_date       ON ingredient_prices(price_date DESC);

-- =============================================================================
-- RECETTE ↔ ÉPICIER (liaison)
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipe_stores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id        UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  grocery_store_id UUID NOT NULL REFERENCES grocery_stores(id) ON DELETE CASCADE,
  note_fr          TEXT,
  note_en          TEXT,
  UNIQUE(recipe_id, grocery_store_id)
);

-- =============================================================================
-- AVIS RECETTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipe_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id         UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating            INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  photo_url         TEXT,
  is_verified_cook  BOOLEAN DEFAULT false,
  helpful_count     INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe ON recipe_reviews(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_user   ON recipe_reviews(user_id);

-- =============================================================================
-- FAVORIS RECETTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipe_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user   ON recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe ON recipe_favorites(recipe_id);

-- =============================================================================
-- PLANS DE REPAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start               DATE NOT NULL,
  plan                     JSONB DEFAULT '{}',
  shopping_list_generated  BOOLEAN DEFAULT false,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);

-- =============================================================================
-- LISTES DE COURSES
-- =============================================================================

CREATE TABLE IF NOT EXISTS shopping_lists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id          UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  recipe_ids            UUID[] DEFAULT '{}',
  items                 JSONB DEFAULT '[]',
  total_estimated_fcfa  DECIMAL(10,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);

-- =============================================================================
-- TRIGGER : avg_rating recettes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_recipe_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE recipes
  SET
    avg_rating    = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM recipe_reviews WHERE recipe_id = NEW.recipe_id),
    ratings_count = (SELECT COUNT(*) FROM recipe_reviews WHERE recipe_id = NEW.recipe_id)
  WHERE id = NEW.recipe_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recipe_avg_rating ON recipe_reviews;
CREATE TRIGGER trg_recipe_avg_rating
  AFTER INSERT OR UPDATE ON recipe_reviews
  FOR EACH ROW EXECUTE FUNCTION update_recipe_avg_rating();

-- =============================================================================
-- RLS : RECETTES
-- =============================================================================

ALTER TABLE recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_stores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists     ENABLE ROW LEVEL SECURITY;

-- Lecture publique des recettes gratuites
CREATE POLICY "recipes_public_free" ON recipes
  FOR SELECT USING (is_published = true AND is_premium = false);

-- Lecture premium pour abonnés actifs
CREATE POLICY "recipes_premium_subscribers" ON recipes
  FOR SELECT USING (
    is_published = true
    AND (
      is_premium = false
      OR EXISTS (
        SELECT 1 FROM premium_subscriptions ps
        WHERE ps.user_id = auth.uid()
          AND ps.status IN ('trial','active')
          AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
      )
    )
  );

-- Écriture pour admins et super_admins
CREATE POLICY "recipes_write_admin" ON recipes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','super_admin','owner'))
  );

-- Ingrédients et étapes : mêmes règles que la recette parente
CREATE POLICY "recipe_ingredients_select" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.is_published = true)
  );

CREATE POLICY "recipe_steps_select" ON recipe_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.is_published = true)
    AND (is_premium = false OR EXISTS (
      SELECT 1 FROM premium_subscriptions ps
      WHERE ps.user_id = auth.uid() AND ps.status IN ('trial','active')
        AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
    ))
  );

-- Épiciers : lecture publique
CREATE POLICY "grocery_stores_public" ON grocery_stores
  FOR SELECT USING (true);

CREATE POLICY "ingredient_prices_public" ON ingredient_prices
  FOR SELECT USING (is_verified = true);

-- Avis : lecture publique, écriture authentifiée
CREATE POLICY "recipe_reviews_public_read" ON recipe_reviews FOR SELECT USING (true);
CREATE POLICY "recipe_reviews_auth_write"  ON recipe_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favoris, plans, listes : données personnelles
CREATE POLICY "recipe_favorites_own" ON recipe_favorites
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "meal_plans_own" ON meal_plans
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shopping_lists_own" ON shopping_lists
  FOR ALL USING (user_id = auth.uid());
