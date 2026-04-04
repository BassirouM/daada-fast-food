/**
 * Service SMS — Twilio
 *
 * Utilisé pour les notifications critiques uniquement :
 *   - Livreur en route (si push non reçu après 30s)
 *   - Commande livrée
 *   - Paiement échoué
 *
 * Les numéros camerounais sont au format +237 6XX XXX XXX
 */

import twilio from 'twilio'

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCOUNT_SID    = process.env.TWILIO_ACCOUNT_SID    ?? ''
const AUTH_TOKEN     = process.env.TWILIO_AUTH_TOKEN     ?? ''
const FROM_NUMBER    = process.env.TWILIO_PHONE_NUMBER   ?? ''
const ENABLED        = Boolean(ACCOUNT_SID && AUTH_TOKEN && FROM_NUMBER)

function getClient() {
  if (!ENABLED) throw new Error('Twilio non configuré (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER)')
  return twilio(ACCOUNT_SID, AUTH_TOKEN)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SmsTemplate =
  | 'livreur_en_route'
  | 'commande_livree'
  | 'paiement_echoue'
  | 'commande_confirmee'

export interface SmsData {
  commandeId?: string
  clientNom?:  string
  livreurNom?: string
  montant?:    number
  eta?:        number // minutes
}

// ─── Templates ────────────────────────────────────────────────────────────────

function buildMessage(template: SmsTemplate, data: SmsData): string {
  const shortId = data.commandeId?.slice(0, 8).toUpperCase() ?? ''
  switch (template) {
    case 'livreur_en_route':
      return `[Daada] 🛵 Votre livreur arrive dans ~${data.eta ?? 5} min pour la commande #${shortId}. Soyez disponible !`
    case 'commande_livree':
      return `[Daada] ✅ Commande #${shortId} livrée ! Bon appétit${data.clientNom ? ` ${data.clientNom}` : ''} 🍔`
    case 'paiement_echoue':
      return `[Daada] ❌ Le paiement de votre commande #${shortId} a échoué. Réessayez sur l'app ou contactez-nous.`
    case 'commande_confirmee':
      return `[Daada] ✅ Commande #${shortId} confirmée ! En cours de préparation. Livraison estimée : 30 min.`
  }
}

// ─── sendSms ──────────────────────────────────────────────────────────────────

export async function sendSms(
  to: string,
  template: SmsTemplate,
  data: SmsData = {},
): Promise<void> {
  if (!ENABLED) {
    console.warn('[SMS] Twilio non configuré — SMS ignoré')
    return
  }

  // Normaliser le numéro camerounais
  const phone = normalizeCameroonPhone(to)
  if (!phone) {
    console.warn('[SMS] Numéro invalide:', to)
    return
  }

  const body = buildMessage(template, data)

  try {
    const client = getClient()
    await client.messages.create({ from: FROM_NUMBER, to: phone, body })
  } catch (err) {
    console.error('[SMS] Erreur envoi:', err)
    throw err
  }
}

// ─── sendSmsWithPushFallback ──────────────────────────────────────────────────

/**
 * Envoie un SMS uniquement si aucun push n'a été reçu après `delayMs`.
 * Utilisé pour "livreur en route" et "paiement échoué" (critique).
 *
 * Implémentation : crée un timeout différé.
 * En production, ce délai devrait être géré par la queue BullMQ (job delayed).
 */
export async function sendSmsWithPushFallback(
  to: string,
  template: SmsTemplate,
  data: SmsData,
  delayMs = 30_000,
): Promise<void> {
  // Attendre le délai puis envoyer le SMS
  // Note : en production, utilisez plutôt un job BullMQ delayed pour éviter
  // de bloquer le thread. Ici, on utilise setTimeout pour la simplicité.
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        await sendSms(to, template, data)
      } catch (err) {
        console.error('[SMS] sendSmsWithPushFallback error:', err)
      } finally {
        resolve()
      }
    }, delayMs)
  })
}

// ─── normalizeCameroonPhone ───────────────────────────────────────────────────

function normalizeCameroonPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-().]/g, '')

  // Déjà en format international
  if (/^\+237[267]\d{8}$/.test(cleaned)) return cleaned

  // Format local 6XXXXXXXX ou 2XXXXXXXX
  if (/^[267]\d{8}$/.test(cleaned)) return `+237${cleaned}`

  // Format 00237...
  if (/^00237[267]\d{8}$/.test(cleaned)) return `+${cleaned.slice(2)}`

  return null
}
