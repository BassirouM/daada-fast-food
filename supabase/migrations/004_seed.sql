-- =============================================================================
-- DAADA FAST FOOD — Données initiales réalistes (Maroua, Cameroun)
-- Migration : 004_seed.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- USERS TEST
-- ---------------------------------------------------------------------------

-- NOTE : en production les users sont créés via auth.users
-- Ici on utilise des UUIDs fixes pour les seeds

INSERT INTO users (id, phone, email, full_name, role, referral_code) VALUES
  ('00000000-0000-0000-0000-000000000001', '+237691000001', 'client@daada.cm',  'Aïssatou Moussa',    'client',     'CLIENT01'),
  ('00000000-0000-0000-0000-000000000002', '+237691000002', 'admin@daada.cm',   'Bassirou Moussa',    'admin',      'ADMIN001'),
  ('00000000-0000-0000-0000-000000000003', '+237691000003', 'driver@daada.cm',  'Moussa Hamidou',     'driver',     'DRIVER01'),
  ('00000000-0000-0000-0000-000000000004', '+237691000004', 'sadmin@daada.cm',  'Super Admin Daada',  'super_admin','SADMIN01')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RESTAURANT DAADA FAST FOOD
-- ---------------------------------------------------------------------------

INSERT INTO restaurants (id, name, owner_id, slug, logo_url, address, lat, lng,
  delivery_radius_km, commission_rate, is_active, phone, whatsapp,
  opening_hours, settings)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Daada Fast Food',
  '00000000-0000-0000-0000-000000000002',
  'daada-fast-food',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
  'Grand Marché, Maroua, Cameroun',
  10.5917,
  14.3167,
  5.0,
  0.10,
  true,
  '+237691000002',
  '+237691000002',
  '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"09:00","close":"23:00"},"sun":{"open":"09:00","close":"23:00"}}',
  '{"currency":"XAF","loyalty_rate":0.1,"min_order":1000}'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CATÉGORIES
-- ---------------------------------------------------------------------------

INSERT INTO categories (id, restaurant_id, name_fr, name_en, slug, icon, position) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Plats',            'Dishes',      'plats',            '🍽️', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Grillades',        'Grilled',     'grillades',        '🔥', 2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Soupes',           'Soups',       'soupes',           '🥣', 3),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Accompagnements',  'Sides',       'accompagnements',  '🌿', 4),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Boissons',         'Drinks',      'boissons',         '🥤', 5),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Petit-déjeuner',   'Breakfast',   'petit-dejeuner',   '🌅', 6)
ON CONFLICT (restaurant_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 25 PLATS CAMEROUNAIS
-- ---------------------------------------------------------------------------

INSERT INTO menu_items (id, restaurant_id, category_id, name_fr, description_fr, price, image_url, is_available, is_featured, prep_time_min, tags) VALUES
-- Plats principaux
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Ndolé aux Crevettes','Plat emblématique aux feuilles de ndolé amères et crevettes fraîches, sauce d''arachide.',2500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,true,25,'{"épicé","populaire","halal"}'),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Poulet DG','Poulet grillé sauce tomate aux légumes frais, accompagné de plantain frit doré.',3000,'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400',true,true,30,'{"populaire","halal"}'),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Eru','Légumes eru mijotés avec huile de palme, crevettes et viande fumée.',2000,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,30,'{"épicé","halal"}'),
('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Koki Haricots','Gâteau de haricot vapeur traditionnel dans feuilles de bananier, épicé et parfumé.',1500,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,20,'{"végétarien","traditionnel"}'),
('30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Mbongo Tchobi','Poisson ou poulet en sauce noire épicée aux épices du terroir camerounais.',2500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,35,'{"épicé","traditionnel","halal"}'),
('30000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Poulet Rôti','Demi-poulet rôti aux herbes et épices, juteux et croustillant.',3500,'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400',true,true,40,'{"populaire","halal"}'),
('30000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Riz Sauce Tomate','Riz blanc parfumé avec sauce tomate maison aux oignons et épices.',1000,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,20,'{"simple","halal"}'),
('30000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Couscous de Mil','Couscous traditionnel de mil servi avec légumes et sauce de viande.',1500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,30,'{"traditionnel","halal"}'),
-- Grillades
('30000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Soya Bœuf','Brochettes de bœuf marinées aux épices locales, grillées sur charbon de bois.',1000,'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400',true,true,15,'{"grillé","populaire","halal"}'),
('30000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Poisson Braisé','Poisson entier braisé sur braises avec épices, servi avec oignons et tomates.',2500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,true,25,'{"grillé","populaire"}'),
('30000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Brochettes Mouton','Brochettes de mouton tendres marinées et grillées, sauce pimentée.',1500,'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400',true,false,20,'{"grillé","halal"}'),
-- Accompagnements
('30000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Plantains Frits','Plantains mûrs frits dorés, croustillants à l''extérieur et moelleux à l''intérieur.',800,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,15,'{"végétarien","populaire"}'),
('30000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Haricots Verts','Haricots verts sautés à l''huile d''arachide avec oignons et épices.',1200,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,15,'{"végétarien"}'),
('30000000-0000-0000-0000-000000000014','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Arachides Grillées','Arachides locales grillées à la perfection, légèrement salées.',300,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,10,'{"végétarien","snack"}'),
('30000000-0000-0000-0000-000000000015','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Chapati','Pain plat moelleux camerounais, idéal pour accompagner les plats en sauce.',200,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,10,'{"végétarien","populaire"}'),
('30000000-0000-0000-0000-000000000016','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Spaghetti Sauce','Spaghetti maison en sauce tomate aux légumes et viande hachée.',1200,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,20,'{"populaire"}'),
-- Boissons
('30000000-0000-0000-0000-000000000017','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005','Jus de Gingembre','Jus de gingembre frais pressé, légèrement sucré et très rafraîchissant.',500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,true,5,'{"naturel","frais"}'),
('30000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005','Bissap','Boisson à l''hibiscus rouge, sucrée et parfumée, servie bien fraîche.',400,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,true,5,'{"naturel","frais","populaire"}'),
('30000000-0000-0000-0000-000000000019','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005','Jus d''Orange','Oranges locales pressées à la minute, sans sucre ajouté.',600,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,5,'{"naturel","frais"}'),
('30000000-0000-0000-0000-000000000020','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005','Eau Minérale','Eau minérale fraîche en bouteille 1,5L.',300,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,1,'{}'),
-- Petit-déjeuner
('30000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','Beignets Haricots','Beignets de haricot noir frits, croustillants, servis avec piment et condiments.',500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,true,15,'{"populaire","matin"}'),
('30000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','Bouillie de Mil','Bouillie de mil chaude et onctueuse, sucrée au miel local.',400,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,15,'{"matin","traditionnel"}'),
('30000000-0000-0000-0000-000000000023','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','Omelette','Omelette aux légumes frais — tomate, oignon, piment, persil.',800,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',true,false,10,'{"matin"}'),
('30000000-0000-0000-0000-000000000024','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','Café Camerounais','Café arabica du terroir camerounais, servi chaud avec lait ou nature.',300,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,5,'{"matin","chaud"}'),
('30000000-0000-0000-0000-000000000025','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','Soupe de Légumes','Bouillon de légumes locaux avec viande ou poisson, très nourrissant.',1500,'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',true,false,20,'{"chaud","halal"}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ZONES DE LIVRAISON
-- ---------------------------------------------------------------------------

INSERT INTO delivery_zones (restaurant_id, name, quartiers, delivery_fee, min_order) VALUES
('10000000-0000-0000-0000-000000000001', 'Centre-ville',   '{"Grand Marché","Dougoi","Kakataré","Kongola"}',   500,  1000),
('10000000-0000-0000-0000-000000000001', 'Domayo / Dougoy','{"Domayo","Lopéré","Balaza","Gazawa"}',             800,  1500),
('10000000-0000-0000-0000-000000000001', 'Périphérie',     '{"Pitoare","Gadala","Wouro Bokki","Meskine"}',    1200,  2000)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- ÉPICIERS DE MAROUA
-- ---------------------------------------------------------------------------

INSERT INTO grocery_stores (id, name, type, quartier, address_detail, lat, lng, phone, specialties, is_verified, is_partner) VALUES
('50000000-0000-0000-0000-000000000001','Grand Marché de Maroua','marche','Centre','Grand Marché central de Maroua',10.5917,14.3167,'+237699000001','{"légumes","épices","viande","poisson"}',true,true),
('50000000-0000-0000-0000-000000000002','Marché Dougoy','marche','Dougoy','Marché de Dougoy, quartier nord',10.6100,14.3200,'+237699000002','{"légumes frais","céréales","fruits"}',true,true),
('50000000-0000-0000-0000-000000000003','Épicerie Al-Amin','epicerie','Kakataré','Rue principale Kakataré',10.5850,14.3050,'+237699000003','{"épices","condiments","huile de palme"}',true,false),
('50000000-0000-0000-0000-000000000004','Supermarché Score Maroua','supermarche','Centre','Avenue Ahmadou Ahidjo, Maroua',10.5930,14.3180,'+237699000004','{"produits importés","boissons","conserves"}',true,false),
('50000000-0000-0000-0000-000000000005','Producteur Ndolé Halima','producteur','Domayo','Ferme Halima, route de Domayo',10.6050,14.3000,'+237699000005','{"ndolé frais","légumes bio"}',false,false),
('50000000-0000-0000-0000-000000000006','Grossiste Céréales Moussa','grossiste','Lopéré','Dépôt Lopéré, entrée ville',10.5780,14.3300,'+237699000006','{"mil","sorgho","maïs","haricots en gros"}',true,false),
('50000000-0000-0000-0000-000000000007','Boucherie Halal Youssouf','epicerie','Kongola','Marché Kongola, stand 12',10.5960,14.3220,'+237699000007','{"viande halal","poulet","mouton","bœuf"}',true,true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PRIX INGRÉDIENTS (20 entrées réalistes)
-- ---------------------------------------------------------------------------

INSERT INTO ingredient_prices (ingredient_name, grocery_store_id, price_fcfa, unit, is_verified) VALUES
('Feuilles de Ndolé (fraîches)','50000000-0000-0000-0000-000000000001',500,'botte',true),
('Feuilles de Ndolé (fraîches)','50000000-0000-0000-0000-000000000005',400,'botte',true),
('Crevettes fraîches','50000000-0000-0000-0000-000000000001',2500,'kg',true),
('Poulet entier','50000000-0000-0000-0000-000000000007',3500,'kg',true),
('Plantain mûr','50000000-0000-0000-0000-000000000001',200,'régime',true),
('Plantain mûr','50000000-0000-0000-0000-000000000002',180,'régime',true),
('Huile de palme','50000000-0000-0000-0000-000000000003',1500,'litre',true),
('Huile de palme','50000000-0000-0000-0000-000000000004',1800,'litre',true),
('Tomates fraîches','50000000-0000-0000-0000-000000000001',300,'kg',true),
('Oignons','50000000-0000-0000-0000-000000000001',200,'kg',true),
('Haricots noirs','50000000-0000-0000-0000-000000000006',600,'kg',true),
('Mil (farine)','50000000-0000-0000-0000-000000000006',400,'kg',true),
('Bœuf (viande)','50000000-0000-0000-0000-000000000007',4000,'kg',true),
('Mouton (viande)','50000000-0000-0000-0000-000000000007',5000,'kg',true),
('Gingembre frais','50000000-0000-0000-0000-000000000001',500,'kg',true),
('Hibiscus (bissap)','50000000-0000-0000-0000-000000000002',800,'kg',true),
('Arachides crues','50000000-0000-0000-0000-000000000006',700,'kg',true),
('Piment rouge frais','50000000-0000-0000-0000-000000000001',300,'kg',true),
('Poisson fumé','50000000-0000-0000-0000-000000000001',3000,'kg',true),
('Eru (légume)','50000000-0000-0000-0000-000000000002',600,'botte',true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- COUPONS PROMOTIONNELS
-- ---------------------------------------------------------------------------

INSERT INTO coupons (restaurant_id, code, discount_type, value, min_order, max_uses, per_user_limit, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'DAADA10',    'percent', 10,   2000, 500, 1, true),
('10000000-0000-0000-0000-000000000001', 'BIENVENUE',  'fixed',   500,  1500, 200, 1, true),
('10000000-0000-0000-0000-000000000001', 'FIDELITE',   'percent', 15,   3000, 100, 3, true)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RECETTES CAMEROUNAISES (10 recettes complètes)
-- ---------------------------------------------------------------------------

INSERT INTO recipes (id, restaurant_id, menu_item_id, title_fr, description_fr, difficulty, prep_time_min, cook_time_min, servings_default, tags, is_premium, is_published, created_by) VALUES
('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Ndolé aux Crevettes de Maman','La recette authentique du ndolé camerounais transmise de génération en génération.','moyen',30,60,4,'{"camerounais","traditionnel","populaire"}',false,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','Poulet DG Maison','Le célèbre poulet DG facile à faire à la maison avec les produits du marché.','facile',20,40,4,'{"camerounais","poulet","rapide"}',false,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',NULL,'Sauce Arachide Secrète','La vraie sauce arachide de Maroua, recette tenue secrète des meilleures cuisinières.','difficile',15,45,6,'{"sauce","arachide","premium"}',true,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000009','Soya au Charbon','Le soya grillé comme au bord des routes de Maroua, marinade authentique.','facile',10,20,4,'{"grillé","soya","rapide"}',false,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000004','Koki Haricots Vapeur','Le koki traditionnel cuit en feuilles de bananier, recette de grand-mère.','moyen',30,90,8,'{"koki","végétarien","vapeur"}',true,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000005','Mbongo Tchobi de Maroua','La sauce noire mystérieuse aux épices rares du Nord Cameroun.','difficile',20,50,4,'{"épicé","poisson","premium","nord-cameroun"}',true,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000008','Couscous de Mil Traditionnel','Le couscous de mil comme préparé dans les concessions de Maroua.','moyen',40,30,6,'{"mil","couscous","traditionnel"}',false,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000017','Jus Gingembre & Citron','Jus détox au gingembre frais, citron et miel, recette maison express.','facile',10,0,2,'{"boisson","naturel","santé"}',false,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','Eru aux Légumes','Le plat d''eru avec toutes ses variantes du Grand Nord.','moyen',20,40,4,'{"eru","légumes","traditionnel"}',true,true,'00000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000021','Beignets Haricots Croustillants','Les beignets de haricot noir parfaits pour un petit-déjeuner à la camerounaise.','facile',20,15,4,'{"beignets","petit-déjeuner","populaire"}',false,true,'00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INGRÉDIENTS RECETTES (recette 1 : Ndolé)
-- ---------------------------------------------------------------------------

INSERT INTO recipe_ingredients (recipe_id, name_fr, quantity, unit, market_category, position) VALUES
('60000000-0000-0000-0000-000000000001','Feuilles de ndolé fraîches',500,'g','légumes',1),
('60000000-0000-0000-0000-000000000001','Crevettes fraîches décortiquées',300,'g','poissonnerie',2),
('60000000-0000-0000-0000-000000000001','Pâte d''arachide',4,'cuillères à soupe','épicerie',3),
('60000000-0000-0000-0000-000000000001','Oignons',2,'pièces','légumes',4),
('60000000-0000-0000-0000-000000000001','Ail',4,'gousses','épices',5),
('60000000-0000-0000-0000-000000000001','Huile de palme',3,'cuillères à soupe','épicerie',6),
('60000000-0000-0000-0000-000000000001','Sel et poivre',NULL,'au goût','épices',7),
('60000000-0000-0000-0000-000000000001','Piment (facultatif)',1,'pièce','épices',8)
ON CONFLICT DO NOTHING;

-- Ingrédients recette 2 : Poulet DG
INSERT INTO recipe_ingredients (recipe_id, name_fr, quantity, unit, market_category, position) VALUES
('60000000-0000-0000-0000-000000000002','Poulet entier découpé',1,'kg','boucherie',1),
('60000000-0000-0000-0000-000000000002','Plantains mûrs',3,'pièces','légumes',2),
('60000000-0000-0000-0000-000000000002','Tomates fraîches',4,'pièces','légumes',3),
('60000000-0000-0000-0000-000000000002','Poivron rouge',2,'pièces','légumes',4),
('60000000-0000-0000-0000-000000000002','Oignons',2,'pièces','légumes',5),
('60000000-0000-0000-0000-000000000002','Huile végétale',4,'cuillères à soupe','épicerie',6),
('60000000-0000-0000-0000-000000000002','Bouillon cube',2,'cubes','épicerie',7)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- ÉTAPES RECETTE 1 : NDOLÉ (étapes publiques uniquement pour le seed)
-- ---------------------------------------------------------------------------

INSERT INTO recipe_steps (recipe_id, position, title_fr, instruction_fr, timer_seconds, is_premium) VALUES
('60000000-0000-0000-0000-000000000001',1,'Préparer le ndolé','Lavez soigneusement les feuilles de ndolé 3 fois. Écrasez-les au mortier ou hachez-les finement pour enlever l''amertume.',NULL,false),
('60000000-0000-0000-0000-000000000001',2,'Cuire le ndolé','Faites bouillir les feuilles 15 minutes dans l''eau salée. Égouttez et pressez bien pour enlever l''excès d''eau.',900,false),
('60000000-0000-0000-0000-000000000001',3,'Préparer la sauce','Faites revenir oignons et ail dans l''huile de palme. Ajoutez la pâte d''arachide diluée dans un peu d''eau chaude.',NULL,true),
('60000000-0000-0000-0000-000000000001',4,'Assembler','Ajoutez le ndolé dans la sauce, puis les crevettes. Laissez mijoter 10 minutes à feu doux. Salez et poivrez.',600,true),
('60000000-0000-0000-0000-000000000001',5,'Servir','Servez chaud accompagné de plantain bouilli, de riz ou de miondo. Bon appétit !',NULL,false)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- LIAISON RECETTES ↔ ÉPICIERS
-- ---------------------------------------------------------------------------

INSERT INTO recipe_stores (recipe_id, grocery_store_id, note_fr) VALUES
('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Meilleur endroit pour les feuilles de ndolé fraîches le matin'),
('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000005','Feuilles de ndolé bio directement du producteur'),
('60000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000007','Poulet halal certifié')
ON CONFLICT DO NOTHING;
