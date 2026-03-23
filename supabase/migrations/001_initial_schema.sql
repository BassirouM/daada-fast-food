-- =============================================================================
-- DAADA FAST FOOD — Initial Database Schema
-- Migration: 001_initial_schema
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'admin', 'delivery_agent', 'kitchen')),
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- MENU
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  description    TEXT,
  image_url      TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id                 UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE RESTRICT,
  name                        TEXT NOT NULL,
  slug                        TEXT UNIQUE NOT NULL,
  description                 TEXT NOT NULL DEFAULT '',
  price                       INTEGER NOT NULL CHECK (price >= 0), -- in XAF (no decimals)
  image_url                   TEXT,
  is_available                BOOLEAN NOT NULL DEFAULT true,
  is_featured                 BOOLEAN NOT NULL DEFAULT false,
  preparation_time_minutes    INTEGER NOT NULL DEFAULT 15,
  calories                    INTEGER,
  tags                        TEXT[] NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_item_option_groups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id    UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_required     BOOLEAN NOT NULL DEFAULT false,
  min_selections  INTEGER NOT NULL DEFAULT 0,
  max_selections  INTEGER NOT NULL DEFAULT 1,
  display_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.menu_item_options (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id         UUID NOT NULL REFERENCES public.menu_item_option_groups(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  price_modifier   INTEGER NOT NULL DEFAULT 0, -- in XAF
  is_available     BOOLEAN NOT NULL DEFAULT true
);

-- =============================================================================
-- DELIVERY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        TEXT NOT NULL,
  quartiers                   TEXT[] NOT NULL DEFAULT '{}',
  delivery_fee                INTEGER NOT NULL CHECK (delivery_fee >= 0),
  min_delivery_time_minutes   INTEGER NOT NULL DEFAULT 20,
  max_delivery_time_minutes   INTEGER NOT NULL DEFAULT 45,
  is_active                   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.delivery_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Maison',
  address_line  TEXT NOT NULL,
  quartier      TEXT NOT NULL,
  ville         TEXT NOT NULL DEFAULT 'Maroua',
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ORDERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number            TEXT UNIQUE NOT NULL,
  customer_id             UUID NOT NULL REFERENCES public.users(id),
  items                   JSONB NOT NULL DEFAULT '[]',
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','preparing','ready','picked_up','delivered','cancelled')),
  timeline                JSONB NOT NULL DEFAULT '[]',
  subtotal                INTEGER NOT NULL CHECK (subtotal >= 0),
  delivery_fee            INTEGER NOT NULL DEFAULT 0,
  discount                INTEGER NOT NULL DEFAULT 0,
  total                   INTEGER NOT NULL CHECK (total >= 0),
  delivery_address_id     UUID REFERENCES public.delivery_addresses(id),
  delivery_latitude       DOUBLE PRECISION,
  delivery_longitude      DOUBLE PRECISION,
  delivery_agent_id       UUID REFERENCES public.users(id),
  estimated_delivery_time TIMESTAMPTZ,
  special_instructions    TEXT,
  payment_id              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PAYMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                  UUID NOT NULL REFERENCES public.orders(id),
  method                    TEXT NOT NULL
                              CHECK (method IN ('mtn_momo', 'orange_money', 'cash_on_delivery')),
  status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  amount                    INTEGER NOT NULL CHECK (amount > 0),
  currency                  TEXT NOT NULL DEFAULT 'XAF',
  phone_number              TEXT,
  provider_transaction_id   TEXT,
  provider_reference        TEXT,
  failure_reason            TEXT,
  initiated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at              TIMESTAMPTZ
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user ON public.delivery_addresses(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Orders: customers see their own orders, admins see all
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Payments: users see own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

-- Delivery addresses: users manage own addresses
CREATE POLICY "Users manage own addresses" ON public.delivery_addresses
  FOR ALL USING (auth.uid() = user_id);

-- Notifications: users see own notifications
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Public read for menu
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.menu_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view available items" ON public.menu_items
  FOR SELECT USING (is_available = true);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
