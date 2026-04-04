-- =============================================================================
-- DAADA FAST FOOD — Module Recettes & Épiciers
-- Migration : 005_recipes.sql
-- =============================================================================

-- =============================================================================
-- RECETTES
-- =============================================================================

CREATE TABLE recipes (
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

CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_recipes_restaurant ON recipes(restaurant_id);
CREATE INDEX idx_recipes_premium    ON recipes(is_premium);
CREATE INDEX idx_recipes_published  ON recipes(is_published);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);

-- =============================================================================
-- INGRÉDIENTS
-- =============================================================================

CREATE TABLE recipe_ingredients (
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

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- =============================================================================
-- ÉTAPES
-- =============================================================================

CREATE TABLE recipe_steps (
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

CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- =============================================================================
-- ÉPICIERS
-- =============================================================================

CREATE TABLE grocery_stores (
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

CREATE INDEX idx_grocery_stores_type      ON grocery_stores(type);
CREATE INDEX idx_grocery_stores_quartier  ON grocery_stores(quartier);
CREATE INDEX idx_grocery_stores_partner   ON grocery_stores(is_partner);

-- =============================================================================
-- PRIX INGRÉDIENTS
-- =============================================================================

CREATE TABLE ingredient_prices (
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

CREATE INDEX idx_ingredient_prices_store      ON ingredient_prices(grocery_store_id);
CREATE INDEX idx_ingredient_prices_ingredient ON ingredient_prices(ingredient_name);
CREATE INDEX idx_ingredient_prices_date       ON ingredient_prices(price_date DESC);

-- =============================================================================
-- RECETTE ↔ ÉPICIER (liaison)
-- =============================================================================

CREATE TABLE recipe_stores (
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

CREATE TABLE recipe_reviews (
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

CREATE INDEX idx_recipe_reviews_recipe ON recipe_reviews(recipe_id);
CREATE INDEX idx_recipe_reviews_user   ON recipe_reviews(user_id);

-- =============================================================================
-- FAVORIS RECETTES
-- =============================================================================

CREATE TABLE recipe_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_favorites_user   ON recipe_favorites(user_id);
CREATE INDEX idx_recipe_favorites_recipe ON recipe_favorites(recipe_id);

-- =============================================================================
-- PLANS DE REPAS
-- =============================================================================

CREATE TABLE meal_plans (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start               DATE NOT NULL,
  plan                     JSONB DEFAULT '{}',
  shopping_list_generated  BOOLEAN DEFAULT false,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);

-- =============================================================================
-- LISTES DE COURSES
-- =============================================================================

CREATE TABLE shopping_lists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id          UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  recipe_ids            UUID[] DEFAULT '{}',
  items                 JSONB DEFAULT '[]',
  total_estimated_fcfa  DECIMAL(10,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);

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

CREATE TRIGGER trg_recipe_avg_rating
  AFTER INSERT OR UPDATE ON recipe_reviews
  FOR EACH ROW EXECUTE FUNCTION update_recipe_avg_rating();

-- =============================================================================
-- RLS : RECETTES
-- =============================================================================

ALTER TABLE recipes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_stores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists    ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "recipe_reviews_public_read"  ON recipe_reviews FOR SELECT USING (true);
CREATE POLICY "recipe_reviews_auth_write"   ON recipe_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favoris, plans, listes : données personnelles
CREATE POLICY "recipe_favorites_own" ON recipe_favorites
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "meal_plans_own" ON meal_plans
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shopping_lists_own" ON shopping_lists
  FOR ALL USING (user_id = auth.uid());
