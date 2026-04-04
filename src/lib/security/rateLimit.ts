/**
 * Utilitaire rate limiting par clé Redis.
 * Graceful degradation si Upstash non configuré.
 */

import { Redis } from '@upstash/redis'

const redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

export type RateLimitResult = {
  ok:        boolean
  remaining: number
  reset:     number  // timestamp Unix (s)
}

/**
 * Compteur glissant Redis par clé.
 * @param key          Clé unique (ex: `rl:upload:${ip}`)
 * @param limit        Nombre max de requêtes
 * @param windowSec    Durée de la fenêtre en secondes
 */
export async function checkRateLimit(
  key:       string,
  limit:     number,
  windowSec: number
): Promise<RateLimitResult> {
  if (!redis) {
    return { ok: true, remaining: limit, reset: 0 }
  }

  try {
    const count = await redis.incr(key)

    if (count === 1) {
      await redis.expire(key, windowSec)
    }

    const ttl = await redis.ttl(key)

    return {
      ok:        count <= limit,
      remaining: Math.max(0, limit - count),
      reset:     Math.floor(Date.now() / 1000) + ttl,
    }
  } catch {
    // Redis indisponible → ne pas bloquer la requête
    return { ok: true, remaining: limit, reset: 0 }
  }
}

/**
 * Ajoute un élément à une liste Redis (historique de recherche, etc.)
 * Limite la liste à maxItems entrées.
 */
export async function pushToList(
  key:      string,
  value:    string,
  maxItems: number,
  ttlSec:   number
): Promise<void> {
  if (!redis) return
  try {
    await redis.lpush(key, value)
    await redis.ltrim(key, 0, maxItems - 1)
    await redis.expire(key, ttlSec)
  } catch { /* Redis indisponible */ }
}

/**
 * Lit une liste Redis (historique de recherche).
 */
export async function getList(key: string, count = 10): Promise<string[]> {
  if (!redis) return []
  try {
    return await redis.lrange(key, 0, count - 1) as string[]
  } catch {
    return []
  }
}
