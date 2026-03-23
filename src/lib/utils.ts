import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price in XAF (Franc CFA)
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format phone number for Cameroon (+237)
 */
export function formatPhoneCM(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('237')) {
    return `+${digits}`
  }
  if (digits.length === 9) {
    return `+237${digits}`
  }
  return phone
}

/**
 * Validate Cameroon phone number
 */
export function isValidPhoneCM(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  // MTN: 650-659, 670-679, 680-689
  // Orange: 690-699, 655-659, 620-629
  const cameroonPattern = /^(?:237)?(?:6(?:[5-9]\d{7}))$/
  return cameroonPattern.test(digits)
}

/**
 * Detect Mobile Money provider from phone number
 */
export function detectMomoProvider(phone: string): 'mtn' | 'orange' | null {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('237') ? digits.slice(3) : digits

  if (/^6[5-8]/.test(local)) return 'mtn'
  if (/^6[9]/.test(local) || /^69/.test(local)) return 'orange'
  return null
}

/**
 * Generate a readable order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `DDA-${timestamp}-${random}`
}

/**
 * Calculate distance between two coordinates (km)
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
