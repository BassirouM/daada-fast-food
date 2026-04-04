/**
 * Script de seed — Daada Fast Food
 *
 * Peuple la base de données Supabase avec des données de test :
 *   - 5 catégories de menu
 *   - 20 plats avec images placeholder
 *   - 1 admin, 3 livreurs, 5 clients
 *   - 10 commandes avec statuts variés
 *
 * Usage : npm run seed
 * Pré-requis : .env.local avec NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'fs'

// ─── Load env ─────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const env = dotenv.readFileSync('.env.local', 'utf-8')
    for (const line of env.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1]!.trim()
        const val = match[2]!.trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = val
      }
    }
  } catch {
    // .env.local absent — utiliser les variables d'environnement existantes
  }
}

loadEnv()

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ─── Image placeholders ───────────────────────────────────────────────────────

function imgUrl(slug: string): string {
  return `https://placehold.co/400x300/FF6B00/FFFFFF/png?text=${encodeURIComponent(slug)}`
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { nom: 'Burgers',    slug: 'burgers',    emoji: '🍔', display_order: 1 },
  { nom: 'Sandwichs',  slug: 'sandwichs',  emoji: '🥪', display_order: 2 },
  { nom: 'Poulet',     slug: 'poulet',     emoji: '🍗', display_order: 3 },
  { nom: 'Boissons',   slug: 'boissons',   emoji: '🥤', display_order: 4 },
  { nom: 'Desserts',   slug: 'desserts',   emoji: '🍰', display_order: 5 },
]

const PLATS = [
  // Burgers
  { nom: 'Daada Burger Classic',  categorie: 'burgers',  prix: 2500, description: 'Steak bœuf, salade, tomate, oignons, sauce maison' },
  { nom: 'Double Cheese Burger',  categorie: 'burgers',  prix: 3200, description: 'Double steak, double fromage fondu, cornichons' },
  { nom: 'Chicken Burger',        categorie: 'burgers',  prix: 2800, description: 'Filet de poulet croustillant, salade coleslaw' },
  { nom: 'Veggie Burger',         categorie: 'burgers',  prix: 2200, description: 'Galette de légumes, avocat, tomate séchée' },
  { nom: 'BBQ Bacon Burger',      categorie: 'burgers',  prix: 3500, description: 'Steak bœuf, bacon croustillant, sauce BBQ fumée' },
  // Sandwichs
  { nom: 'Club Sandwich',         categorie: 'sandwichs', prix: 2000, description: 'Pain de mie, poulet, bacon, tomate, laitue, mayo' },
  { nom: 'Panini Jambon Fromage', categorie: 'sandwichs', prix: 1800, description: 'Pain ciabatta, jambon, emmental, moutarde' },
  { nom: 'Wrap Poulet Mexicain',  categorie: 'sandwichs', prix: 2200, description: 'Tortilla, poulet épicé, guacamole, salsa' },
  { nom: 'Shawarma Bœuf',         categorie: 'sandwichs', prix: 2500, description: 'Pain pita, bœuf mariné, sauce tahini, persil' },
  // Poulet
  { nom: 'Poulet Frit 4 pièces',  categorie: 'poulet',   prix: 3500, description: 'Poulet croustillant, épices secrètes Daada' },
  { nom: 'Wings Buffalo',         categorie: 'poulet',   prix: 2800, description: '8 ailerons de poulet, sauce buffalo piquante' },
  { nom: 'Poulet Grillé',         categorie: 'poulet',   prix: 4000, description: 'Demi-poulet mariné, herbes fraîches, citron' },
  { nom: 'Nuggets 10 pièces',     categorie: 'poulet',   prix: 2000, description: 'Nuggets de poulet, sauce ketchup ou mayo' },
  { nom: 'Poulet à la Plancha',   categorie: 'poulet',   prix: 3200, description: 'Filets de poulet, sauce aux poivrons, frites' },
  // Boissons
  { nom: 'Coca-Cola',             categorie: 'boissons', prix: 500,  description: 'Canette 33cl bien fraîche' },
  { nom: 'Jus de Bissap',         categorie: 'boissons', prix: 700,  description: 'Jus naturel d\'hibiscus, glacé, fait maison' },
  { nom: 'Eau Minérale',          categorie: 'boissons', prix: 400,  description: 'Bouteille 50cl' },
  // Desserts
  { nom: 'Glace Vanille',         categorie: 'desserts', prix: 800,  description: 'Deux boules de glace artisanale à la vanille' },
  { nom: 'Fondant au Chocolat',   categorie: 'desserts', prix: 1200, description: 'Fondant tiède, cœur coulant, crème anglaise' },
  { nom: 'Tarte aux Fruits',      categorie: 'desserts', prix: 1000, description: 'Fruits de saison, pâte sablée, crème pâtissière' },
]

const QUARTIERS_MAROUA = [
  'Domayo', 'Kakataré', 'Doualaré', 'Kongola', 'Lopéré',
  'Ouro-Tchédé', 'Founangué', 'Pitoare', 'Dougoy',
]

const ORDER_STATUSES = [
  'pending', 'confirmed', 'preparing', 'ready',
  'picked_up', 'delivered', 'cancelled',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedCategories() {
  console.log('📦 Seed catégories...')
  const { data, error } = await supabase
    .from('menu_categories')
    .upsert(CATEGORIES, { onConflict: 'slug' })
    .select('id, slug')

  if (error) throw new Error(`Categories: ${error.message}`)
  console.log(`  ✓ ${data?.length ?? 0} catégories`)
  return data ?? []
}

async function seedMenuItems(categories: Array<{ id: string; slug: string }>) {
  console.log('🍔 Seed plats...')
  const catMap: Record<string, string> = {}
  for (const c of categories) catMap[c.slug] = c.id

  const items = PLATS.map((p) => ({
    nom:          p.nom,
    description:  p.description,
    prix:         p.prix,
    image_url:    imgUrl(p.nom),
    categorie_id: catMap[p.categorie],
    disponible:   true,
    est_vedette:  Math.random() > 0.7,
    created_at:   new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('menus')
    .upsert(items, { onConflict: 'nom' })
    .select('id, nom')

  if (error) throw new Error(`Menu items: ${error.message}`)
  console.log(`  ✓ ${data?.length ?? 0} plats`)
  return data ?? []
}

async function seedUsers() {
  console.log('👥 Seed utilisateurs...')

  const users = [
    // Admin
    { phone: '+237699000001', nom: 'Admin Daada',    role: 'admin',          quartier: 'Domayo',    is_verified: true },
    // Livreurs
    { phone: '+237677000010', nom: 'Moussa Livreur', role: 'delivery_agent', quartier: 'Kakataré',  is_verified: true },
    { phone: '+237677000011', nom: 'Hamidou Rider',  role: 'delivery_agent', quartier: 'Domayo',    is_verified: true },
    { phone: '+237677000012', nom: 'Ibrahim Moto',   role: 'delivery_agent', quartier: 'Doualaré',  is_verified: true },
    // Clients
    { phone: '+237695000020', nom: 'Aïssatou Diallo',  role: 'customer', quartier: 'Kongola',    is_verified: true },
    { phone: '+237695000021', nom: 'Fatouma Bello',    role: 'customer', quartier: 'Lopéré',     is_verified: true },
    { phone: '+237695000022', nom: 'Oumarou Garga',    role: 'customer', quartier: 'Dougoy',     is_verified: true },
    { phone: '+237695000023', nom: 'Mariama Sali',     role: 'customer', quartier: 'Pitoare',    is_verified: true },
    { phone: '+237695000024', nom: 'Aboubakar Yerima', role: 'customer', quartier: 'Doualaré',   is_verified: true },
  ]

  const { data, error } = await supabase
    .from('users')
    .upsert(users, { onConflict: 'phone' })
    .select('id, phone, role')

  if (error) throw new Error(`Users: ${error.message}`)
  console.log(`  ✓ ${data?.length ?? 0} utilisateurs (1 admin, 3 livreurs, 5 clients)`)
  return data ?? []
}

async function seedOrders(
  users: Array<{ id: string; phone: string; role: string }>,
  menuItems: Array<{ id: string; nom: string }>,
) {
  console.log('📋 Seed commandes...')

  const clients   = users.filter((u) => u.role === 'customer')
  const livreurs  = users.filter((u) => u.role === 'delivery_agent')

  const ordersData = Array.from({ length: 10 }, (_, i) => {
    const client    = randomItem(clients)!
    const statut    = randomItem(ORDER_STATUSES)!
    const quartier  = randomItem(QUARTIERS_MAROUA)!
    const nbArticles = Math.floor(Math.random() * 3) + 1

    const articles = Array.from({ length: nbArticles }, () => ({
      menu_id:    randomItem(menuItems)!.id,
      quantite:   Math.floor(Math.random() * 2) + 1,
      prix_unit:  PLATS[Math.floor(Math.random() * PLATS.length)]?.prix ?? 2500,
    }))

    const sousTotal = articles.reduce((sum, a) => sum + a.prix_unit * a.quantite, 0)
    const fraisLivraison = 500
    const total = sousTotal + fraisLivraison

    return {
      client_id:       client.id,
      livreur_id:      ['picked_up', 'delivered'].includes(statut) ? randomItem(livreurs)?.id ?? null : null,
      statut,
      quartier_livraison: quartier,
      adresse_livraison:  `Quartier ${quartier}, Maroua`,
      sous_total:      sousTotal,
      frais_livraison: fraisLivraison,
      total,
      methode_paiement: randomItem(['mtn_momo', 'orange_money', 'cash'] as const),
      created_at:      daysAgo(Math.floor(Math.random() * 30)),
    }
  })

  const { data, error } = await supabase
    .from('commandes')
    .insert(ordersData)
    .select('id')

  if (error) throw new Error(`Orders: ${error.message}`)
  console.log(`  ✓ ${data?.length ?? 0} commandes avec statuts variés`)
  return data ?? []
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🍔 Daada Fast Food — Seed démarré\n')

  try {
    const categories = await seedCategories()
    const menuItems  = await seedMenuItems(categories as Array<{ id: string; slug: string }>)
    const users      = await seedUsers()
    await seedOrders(
      users as Array<{ id: string; phone: string; role: string }>,
      menuItems as Array<{ id: string; nom: string }>,
    )

    console.log('\n✅ Seed terminé avec succès !\n')
    console.log('Comptes de test :')
    console.log('  Admin    : +237699000001')
    console.log('  Livreur  : +237677000010')
    console.log('  Client   : +237695000020')
    console.log('\nMot de passe OTP : utiliser le flow Supabase Auth')
  } catch (err) {
    console.error('\n❌ Erreur seed :', err)
    process.exit(1)
  }
}

main()
