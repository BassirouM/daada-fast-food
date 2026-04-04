-- =============================================================================
-- DAADA FAST FOOD — Données initiales (Maroua, Cameroun)
-- Migration : 003_seed_data
-- =============================================================================

-- =============================================================================
-- MENUS — 20 plats camerounais avec prix FCFA réalistes
-- =============================================================================

-- ── Burgers (5) ─────────────────────────────────────────────────────────────
INSERT INTO public.menus (nom, description, prix, categorie, disponible, temps_preparation, tags) VALUES
  (
    'Burger Daada',
    'Notre burger signature : steak haché maison, laitue fraîche, tomate, sauce spéciale Daada',
    2500, 'Burgers', true, 12,
    ARRAY['signature', 'populaire']
  ),
  (
    'Double Cheese Burger',
    'Double steak, double cheddar fondu, pickles, oignons caramélisés, sauce barbecue',
    3000, 'Burgers', true, 15,
    ARRAY['fromage', 'généreux']
  ),
  (
    'Burger Poulet Grillé',
    'Blanc de poulet grillé, avocat, salade verte, mayonnaise maison, pain brioche',
    2000, 'Burgers', true, 12,
    ARRAY['poulet', 'léger']
  ),
  (
    'Veggie Burger',
    'Galette de pois chiches épicée, hummus, légumes grillés, roquette, pain complet',
    1800, 'Burgers', true, 10,
    ARRAY['végétarien', 'sain']
  ),
  (
    'Burger Spécial Daada',
    'Steak Wagyu local, truffe noire, foie gras, brioche artisanale – notre chef-d''œuvre',
    3500, 'Burgers', true, 20,
    ARRAY['premium', 'signature', 'halal']
  )
ON CONFLICT DO NOTHING;

-- ── Poulet (4) ───────────────────────────────────────────────────────────────
INSERT INTO public.menus (nom, description, prix, categorie, disponible, temps_preparation, tags) VALUES
  (
    'Poulet Braisé Entier',
    'Poulet braisé à la braise de bois, marinade d''épices africaines, servi avec plantains frits',
    3000, 'Poulet', true, 25,
    ARRAY['braisé', 'traditionnel', 'halal']
  ),
  (
    'Ailes Épicées (8 pièces)',
    'Ailes de poulet marinées au piment, ail et gingembre, sauce piquante maison',
    1500, 'Poulet', true, 15,
    ARRAY['épicé', 'finger-food']
  ),
  (
    'Poulet Yassa',
    'Poulet mijoté dans la sauce yassa aux oignons et citron, accompagné de riz basmati',
    2500, 'Poulet', true, 20,
    ARRAY['traditionnel', 'sénégalais', 'halal']
  ),
  (
    'Cuisse de Poulet Grillée',
    'Cuisse dorée au four, herbes fraîches, citron confit, servi avec salade de crudités',
    2000, 'Poulet', true, 18,
    ARRAY['grillé', 'léger', 'halal']
  )
ON CONFLICT DO NOTHING;

-- ── Pizzas (3) ───────────────────────────────────────────────────────────────
INSERT INTO public.menus (nom, description, prix, categorie, disponible, temps_preparation, tags) VALUES
  (
    'Pizza Margherita',
    'Sauce tomate maison, mozzarella fraîche, basilic frais, filet d''huile d''olive',
    4000, 'Pizza', true, 18,
    ARRAY['classique', 'végétarien']
  ),
  (
    'Pizza Poulet Fumé',
    'Poulet fumé local, poivrons colorés, oignons rouges, mozzarella, sauce barbecue maison',
    4500, 'Pizza', true, 20,
    ARRAY['poulet', 'fumé', 'halal']
  ),
  (
    'Pizza 4 Fromages',
    'Mozzarella, cheddar, gouda, parmesan, crème fraîche, noix de muscade',
    5000, 'Pizza', true, 20,
    ARRAY['fromage', 'premium', 'végétarien']
  )
ON CONFLICT DO NOTHING;

-- ── Boissons (4) ────────────────────────────────────────────────────────────
INSERT INTO public.menus (nom, description, prix, categorie, disponible, temps_preparation, tags) VALUES
  (
    'Jus de Gingembre Frais',
    'Gingembre pressé, citron vert, miel sauvage – préparé à la commande',
    500, 'Boissons', true, 3,
    ARRAY['naturel', 'sans sucre ajouté']
  ),
  (
    'Bissap (Fleur d''hibiscus)',
    'Infusion de fleurs d''hibiscus séchées, sucre de canne, menthe fraîche, servi glacé',
    500, 'Boissons', true, 3,
    ARRAY['traditionnel', 'rafraîchissant']
  ),
  (
    'Jus de Bouye (Pain de Singe)',
    'Pulpe de baobab mixée, lait concentré, vanille – boisson de l''Afrique de l''Ouest',
    600, 'Boissons', true, 3,
    ARRAY['exotique', 'traditionnel']
  ),
  (
    'Eau Minérale',
    'Eau minérale naturelle de la région, 75cl, servie fraîche',
    300, 'Boissons', true, 1,
    ARRAY['essentiel']
  )
ON CONFLICT DO NOTHING;

-- ── Desserts (4) ────────────────────────────────────────────────────────────
INSERT INTO public.menus (nom, description, prix, categorie, disponible, temps_preparation, tags) VALUES
  (
    'Beignets de Haricots',
    'Beignets croustillants à base de haricots niébé, épices douces, sauce pimentée légère',
    300, 'Desserts', true, 8,
    ARRAY['traditionnel', 'vegan']
  ),
  (
    'Gâteau Chocolat Fondant',
    'Cœur fondant au chocolat 70%, glace vanille artisanale, coulis de fruits rouges',
    1000, 'Desserts', true, 5,
    ARRAY['chocolat', 'premium']
  ),
  (
    'Beignets Banane Plantain',
    'Banane plantain mûre frite dans l''huile de palme, saupoudrée de cannelle et sucre',
    400, 'Desserts', true, 6,
    ARRAY['traditionnel', 'camerounais', 'vegan']
  ),
  (
    'Crème Caramel Maison',
    'Crème caramel onctueuse préparée chaque matin, caramel beurre salé artisanal',
    800, 'Desserts', true, 2,
    ARRAY['artisanal', 'populaire']
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ZONES DE LIVRAISON — Quartiers de Maroua
-- =============================================================================
-- (Ces données sont en doublon avec 002_seed_data.sql pour la table delivery_zones
--  qui appartient à l'ancien schéma. Les données ci-dessous sont à usage futur
--  si delivery_zones est ajoutée dans le nouveau schéma.)

-- =============================================================================
-- COMPTE ADMIN TEST
-- ⚠️ À supprimer en production — remplacer par un vrai compte Supabase
-- =============================================================================
-- L'insertion d'un admin se fait via Supabase Auth, puis ici pour le profil.
-- En production, créer l'utilisateur via Dashboard Supabase et insérer l'UUID ici.
-- Exemple :
-- INSERT INTO public.users (id, telephone, nom, role) VALUES
--   ('00000000-0000-0000-0000-000000000001', '+237699000000', 'Admin Daada', 'admin')
-- ON CONFLICT (telephone) DO NOTHING;
