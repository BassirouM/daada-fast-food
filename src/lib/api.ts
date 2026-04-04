import type { ApiResponse } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

type FetchOptions = RequestInit & {
  token?: string
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { token, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
    const json = await res.json()

    if (!res.ok) {
      return {
        data: null,
        error: json.error ?? `HTTP ${res.status}`,
        status: res.status,
      }
    }

    return { data: json, error: null, status: res.status }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
      status: 0,
    }
  }
}

export function buildApiUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, BASE_URL || 'http://localhost:3000')
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.pathname + url.search
}
