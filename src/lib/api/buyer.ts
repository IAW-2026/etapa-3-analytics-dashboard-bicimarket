import type { FilterState, PaginatedResponse, Buyer } from "@/lib/mock/types"

const BASE = "/api/internal/analytics/buyer"

function internalOrigin(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT || 3000}`
}

async function proxyFetch<T>(slug: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const searchParams = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value))
      }
    }
  }
  const qs = searchParams.toString()
  const path = qs ? `${BASE}/${slug}?${qs}` : `${BASE}/${slug}`
  const url = `${internalOrigin()}${path}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    console.error(`[buyer-api] ${res.status} ${url}`, body)
    throw new Error(body?.error?.message ?? `Buyer API error: ${res.status}`)
  }
  return res.json()
}

function dateParams(filters?: Partial<FilterState>) {
  return {
    from: filters?.from instanceof Date ? filters.from.toISOString() : undefined,
    to: filters?.to instanceof Date ? filters.to.toISOString() : undefined,
  }
}

export async function getBuyerMetrics(filters?: Partial<FilterState>) {
  return proxyFetch<{
    total: number
    new_this_period: number
    repeat_rate: number
    at_risk_count: number
  }>("admin/buyers/metrics", dateParams(filters))
}

export async function getBuyers(filters?: Partial<FilterState> & { page?: number; limit?: number }) {
  return proxyFetch<PaginatedResponse<Buyer>>("admin/buyers", {
    ...dateParams(filters),
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 20,
  })
}
