/**
 * Schémas de validation Zod + sanitisation des inputs
 *
 * Chaque schéma valide ET nettoie les données avant traitement.
 * Utiliser dans les API routes :
 *
 *   const result = createCommandeSchema.safeParse(body)
 *   if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
 */

import { z } from 'zod'

// ─── Regex et constantes ──────────────────────────────────────────────────────

/**
 * Numéros camerounais valides :
 *   - 6[5-9]XXXXXXX  (MTN: 65x-69x, Orange: 69x)
 *   - 2[2-3]XXXXXXX  (fixe)
 * Format accepté : avec ou sans +237 / 237
 */
const PHONE_CM_REGEX = /^(\+237|237)?(6[5-9]|2[2-3])\d{7}$/

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ─── Schémas atomiques réutilisables ──────────────────────────────────────────

const telephoneSchema = z
  .string()
  .trim()
  .regex(PHONE_CM_REGEX, 'Numéro de téléphone camerounais invalide (ex: 677123456)')

const uuidSchema = z
  .string()
  .trim()
  .regex(UUID_REGEX, 'Identifiant UUID invalide')

const textSchema = (max = 500) =>
  z.string().trim().min(1).max(max)

// ─── 1. Auth / Login ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  telephone: telephoneSchema,
})

export type LoginInput = z.infer<typeof loginSchema>

// ─── 2. OTP ───────────────────────────────────────────────────────────────────

export const otpSchema = z.object({
  telephone: telephoneSchema,
  code: z
    .string()
    .trim()
    .length(6, 'Le code OTP doit contenir exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code OTP ne doit contenir que des chiffres'),
})

export type OtpInput = z.infer<typeof otpSchema>

// ─── 3. Mise à jour du profil ─────────────────────────────────────────────────

export const updateProfilSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[\p{L}\s'-]+$/u, 'Le nom contient des caractères non autorisés')
    .optional(),
  quartier: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  fcm_token: z
    .string()
    .trim()
    .max(500)
    .optional(),
})

export type UpdateProfilInput = z.infer<typeof updateProfilSchema>

// ─── 4. Article de commande ───────────────────────────────────────────────────

const commandeArticleSchema = z.object({
  menu_id:      uuidSchema,
  nom:          textSchema(200),
  quantite:     z.number().int().min(1, 'Quantité minimum : 1').max(50, 'Quantité maximum : 50'),
  prix_unitaire: z.number().int().min(0, 'Le prix ne peut pas être négatif'),
})

// ─── 5. Création de commande ──────────────────────────────────────────────────

export const createCommandeSchema = z.object({
  adresse_livraison: z
    .string()
    .trim()
    .min(10, 'Adresse trop courte (minimum 10 caractères)')
    .max(500, 'Adresse trop longue'),
  frais_livraison: z
    .number()
    .int()
    .min(0, 'Les frais de livraison ne peuvent pas être négatifs')
    .default(0),
  articles: z
    .array(commandeArticleSchema)
    .min(1, 'La commande doit contenir au moins un article')
    .max(30, 'La commande ne peut pas contenir plus de 30 articles différents'),
  note_cuisinier: z
    .string()
    .trim()
    .max(500, 'La note ne peut pas dépasser 500 caractères')
    .optional(),
})

export type CreateCommandeInput = z.infer<typeof createCommandeSchema>

// ─── 6. Création de paiement ──────────────────────────────────────────────────

export const createPaiementSchema = z.object({
  commande_id: uuidSchema,
  methode: z.enum(['mtn_momo', 'orange_money', 'cinetpay', 'cash'], {
    message: 'Méthode de paiement invalide',
  }),
  telephone_paiement: telephoneSchema.optional(),
  idempotency_key: z
    .string()
    .trim()
    .min(16, "Clé d'idempotence trop courte")
    .max(128, "Clé d'idempotence trop longue"),
})

export type CreatePaiementInput = z.infer<typeof createPaiementSchema>

// ─── 7. Pagination ────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// ─── Sanitisation ─────────────────────────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&':  '&amp;',
  '<':  '&lt;',
  '>':  '&gt;',
  '"':  '&quot;',
  "'":  '&#x27;',
  '/':  '&#x2F;',
}

/**
 * Échappe les caractères HTML dangereux pour prévenir les XSS.
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
}

/**
 * Normalise un numéro de téléphone camerounais au format +237XXXXXXXXX.
 */
export function normalizeTelephone(telephone: string): string {
  const cleaned = telephone.replace(/\s+/g, '').replace(/^(\+237|237)/, '')
  return `+237${cleaned}`
}

/**
 * Valide un numéro de téléphone camerounais sans passer par Zod.
 * Utile pour les vérifications rapides (OTP, etc.).
 */
export function isValidTelephoneCM(telephone: string): boolean {
  return PHONE_CM_REGEX.test(telephone)
}

/**
 * Parse et valide les données d'une request body avec un schéma Zod.
 * Retourne `{ data, error }` — jamais de throw.
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { data: T; error: null } | { data: null; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { data: result.data, error: null }
  }
  return { data: null, error: result.error }
}
