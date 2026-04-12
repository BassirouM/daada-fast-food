/**
 * Service Email — Resend
 *
 * Templates HTML :
 *   - orderConfirmation : récapitulatif articles + total
 *   - orderDelivered    : lien avis + facture
 *   - welcome           : bienvenue nouvel utilisateur
 *
 * Fonction principale : sendEmail(to, template, data)
 */

import { Resend } from 'resend'

// ─── Config ───────────────────────────────────────────────────────────────────

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY non configuré')
    _resend = new Resend(key)
  }
  return _resend
}
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'Daada Fast Food <noreply@daada.cm>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://daada-fast-food.vercel.app'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  nom:       string
  quantite:  number
  prixUnit:  number
  sousTotal: number
}

export interface OrderConfirmationData {
  commandeId:    string
  clientNom:     string
  articles:      OrderItem[]
  sousTotal:     number
  fraisLivraison: number
  total:         number
  adresse:       string
  methodePaiement: string
  dateCommande:  string
}

export interface OrderDeliveredData {
  commandeId:  string
  clientNom:   string
  total:       number
  livreurNom:  string
  datelivraison: string
}

export interface WelcomeData {
  clientNom:     string
  clientPhone:   string
}

export type EmailTemplate =
  | { type: 'orderConfirmation'; data: OrderConfirmationData }
  | { type: 'orderDelivered';    data: OrderDeliveredData }
  | { type: 'welcome';           data: WelcomeData }

// ─── HTML Templates ───────────────────────────────────────────────────────────

function baseLayout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A1A;border-radius:16px;overflow:hidden;border:1px solid #2A2A2A;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#F97316,#EA580C);padding:28px 32px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">🍔 Daada</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Fast Food · Maroua, Cameroun</div>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#111111;padding:20px 32px;text-align:center;border-top:1px solid #2A2A2A;">
            <p style="margin:0;font-size:12px;color:#666666;">
              © 2026 Daada Fast Food · Maroua, Cameroun<br>
              <a href="${APP_URL}" style="color:#F97316;text-decoration:none;">daada.cm</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function formatPrice(xaf: number): string {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(xaf)
}

function templateOrderConfirmation(d: OrderConfirmationData): { subject: string; html: string } {
  const shortId = d.commandeId.slice(0, 8).toUpperCase()

  const lignes = d.articles.map((a) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2A2A2A;color:#FFFFFF;font-size:14px;">
        ${a.nom} × ${a.quantite}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #2A2A2A;color:#F97316;font-size:14px;text-align:right;font-weight:600;">
        ${formatPrice(a.sousTotal)}
      </td>
    </tr>`).join('')

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#FFFFFF;">Commande confirmée ✅</h2>
    <p style="margin:0 0 24px;color:#888888;font-size:14px;">Bonjour ${d.clientNom}, votre commande <strong style="color:#F97316;">#${shortId}</strong> a été reçue.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${lignes}
      <tr>
        <td style="padding:8px 0;color:#888888;font-size:13px;">Sous-total</td>
        <td style="padding:8px 0;color:#888888;font-size:13px;text-align:right;">${formatPrice(d.sousTotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#888888;font-size:13px;">Livraison</td>
        <td style="padding:8px 0;color:#888888;font-size:13px;text-align:right;">${formatPrice(d.fraisLivraison)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-size:16px;font-weight:800;color:#FFFFFF;">Total</td>
        <td style="padding:12px 0 0;font-size:16px;font-weight:800;color:#F97316;text-align:right;">${formatPrice(d.total)}</td>
      </tr>
    </table>

    <div style="background:#222222;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Livraison à</p>
      <p style="margin:0;font-size:14px;color:#FFFFFF;">${d.adresse}</p>
    </div>

    <a href="${APP_URL}/orders/${d.commandeId}"
      style="display:block;padding:14px;border-radius:12px;background:linear-gradient(135deg,#F97316,#EA580C);color:#FFFFFF;text-decoration:none;text-align:center;font-weight:700;font-size:15px;box-shadow:0 4px 20px rgba(249,115,22,0.3);">
      🏍 Suivre ma commande
    </a>
  `, `Commande #${shortId} confirmée — Daada Fast Food`)

  return { subject: `✅ Commande #${shortId} confirmée — Daada`, html }
}

function templateOrderDelivered(d: OrderDeliveredData): { subject: string; html: string } {
  const shortId = d.commandeId.slice(0, 8).toUpperCase()

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#FFFFFF;">Commande livrée 🎉</h2>
    <p style="margin:0 0 24px;color:#888888;font-size:14px;">
      Bonjour ${d.clientNom}, votre commande <strong style="color:#F97316;">#${shortId}</strong> a été livrée par <strong style="color:#FFFFFF;">${d.livreurNom}</strong>.
    </p>

    <div style="background:#222222;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">⭐</div>
      <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#FFFFFF;">Comment était votre expérience ?</p>
      <div style="display:inline-flex;gap:8px;">
        ${[1,2,3,4,5].map((n) =>
          `<a href="${APP_URL}/orders/${d.commandeId}?rate=${n}" style="display:inline-block;width:40px;height:40px;line-height:40px;border-radius:50%;background:#2A2A2A;color:#FFFFFF;text-decoration:none;font-size:18px;text-align:center;">${'⭐'.slice(0, n > 4 ? 2 : 1)}</a>`
        ).join('')}
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <a href="${APP_URL}/orders/${d.commandeId}"
        style="flex:1;display:block;padding:12px;border-radius:12px;background:linear-gradient(135deg,#F97316,#EA580C);color:#FFFFFF;text-decoration:none;text-align:center;font-weight:700;font-size:14px;">
        📄 Voir la facture
      </a>
      <a href="${APP_URL}/menu"
        style="flex:1;display:block;padding:12px;border-radius:12px;border:1.5px solid #333333;color:#FFFFFF;text-decoration:none;text-align:center;font-weight:600;font-size:14px;">
        🍔 Commander encore
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#444444;text-align:center;">
      Montant total payé : <strong style="color:#F97316;">${formatPrice(d.total)}</strong> · ${d.datelivraison}
    </p>
  `, `Commande #${shortId} livrée — Daada Fast Food`)

  return { subject: `🎉 Commande #${shortId} livrée ! Donnez votre avis`, html }
}

function templateWelcome(d: WelcomeData): { subject: string; html: string } {
  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#FFFFFF;">Bienvenue chez Daada 🎉</h2>
    <p style="margin:0 0 24px;color:#888888;font-size:14px;">
      Bonjour <strong style="color:#FFFFFF;">${d.clientNom}</strong> ! Votre compte Daada Fast Food est créé.
    </p>

    <div style="background:#222222;border-radius:10px;padding:20px;margin-bottom:24px;">
      ${[
        ['🍔', 'Menu varié', 'Burgers, sandwichs, boissons et plus encore'],
        ['🛵', 'Livraison rapide', 'Livraison dans tous les quartiers de Maroua'],
        ['📱', 'Suivi en temps réel', 'Suivez votre commande en direct sur la carte'],
        ['💰', 'Mobile Money', 'MTN MoMo et Orange Money acceptés'],
      ].map(([icon, titre, desc]) => `
        <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start;">
          <div style="font-size:22px;min-width:32px;">${icon}</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#FFFFFF;margin-bottom:2px;">${titre}</div>
            <div style="font-size:13px;color:#888888;">${desc}</div>
          </div>
        </div>`).join('')}
    </div>

    <a href="${APP_URL}/menu"
      style="display:block;padding:14px;border-radius:12px;background:linear-gradient(135deg,#F97316,#EA580C);color:#FFFFFF;text-decoration:none;text-align:center;font-weight:700;font-size:15px;box-shadow:0 4px 20px rgba(249,115,22,0.3);">
      🍔 Découvrir le menu
    </a>
  `, 'Bienvenue chez Daada Fast Food')

  return { subject: '🎉 Bienvenue chez Daada Fast Food !', html }
}

// ─── sendEmail ────────────────────────────────────────────────────────────────

export async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY non configuré — email ignoré')
    return
  }

  let subject = ''
  let html    = ''

  switch (template.type) {
    case 'orderConfirmation': {
      const t = templateOrderConfirmation(template.data)
      subject = t.subject; html = t.html; break
    }
    case 'orderDelivered': {
      const t = templateOrderDelivered(template.data)
      subject = t.subject; html = t.html; break
    }
    case 'welcome': {
      const t = templateWelcome(template.data)
      subject = t.subject; html = t.html; break
    }
  }

  const { error } = await getResend().emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(`[Resend] ${error.message}`)
}
