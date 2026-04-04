-- =============================================================================
-- DAADA FAST FOOD — Seed Data (Maroua, Cameroun)
-- Migration: 002_seed_data
-- =============================================================================

-- Menu Categories
INSERT INTO public.menu_categories (name, slug, description, display_order) VALUES
  ('Burgers', 'burgers', 'Nos délicieux burgers maison', 1),
  ('Poulet', 'poulet', 'Poulet grillé et frit', 2),
  ('Shawarma', 'shawarma', 'Shawarma et wraps', 3),
  ('Pizza', 'pizza', 'Pizzas fraîches du four', 4),
  ('Accompagnements', 'accompagnements', 'Frites, salades et plus', 5),
  ('Boissons', 'boissons', 'Sodas, jus et eau', 6)
ON CONFLICT (slug) DO NOTHING;

-- Delivery Zones (Quartiers de Maroua)
INSERT INTO public.delivery_zones (name, quartiers, delivery_fee, min_delivery_time_minutes, max_delivery_time_minutes) VALUES
  ('Centre', ARRAY['Centre-ville', 'Domayo', 'Kakataré'], 300, 15, 30),
  ('Zone Nord', ARRAY['Djarengol', 'Pitoaré', 'Pont-Vert'], 500, 20, 40),
  ('Zone Sud', ARRAY['Meskine', 'Hardé', 'Ngassa'], 500, 25, 45),
  ('Zone Est', ARRAY['Kongola', 'Makabaye', 'Founangué'], 700, 30, 50),
  ('Périphérie', ARRAY['Bamaré', 'Papata', 'Zokok'], 1000, 35, 60)
ON CONFLICT DO NOTHING;
