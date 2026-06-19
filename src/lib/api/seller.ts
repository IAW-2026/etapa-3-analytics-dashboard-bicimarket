import type { FilterState, PaginatedResponse } from "@/lib/mock/types"

const BASE = "/api/internal/analytics/seller"

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
  const url = qs ? `${BASE}/${slug}?${qs}` : `${BASE}/${slug}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    console.error(`[seller-api] ${res.status} ${url}`, body)
    throw new Error(body?.error?.message ?? `Seller API error: ${res.status}`)
  }
  return res.json()
}

function dateParams(filters?: Partial<FilterState>) {
  return {
    from: filters?.from instanceof Date ? filters.from.toISOString() : undefined,
    to: filters?.to instanceof Date ? filters.to.toISOString() : undefined,
  }
}

export interface SellerProfileItem {
  id: string
  display_name: string
  legal_name: string
  tax_id: string
  tax_condition: string
  bank_account_reference: string
  verification_status: "pending_review" | "verified" | "suspended"
  product_count: number
  created_at: string
}

export async function getSellerMetrics() {
  return proxyFetch<{
    total: number
    verified_count: number
    pending_count: number
    suspended_count: number
    product_count_total: number
  }>("sellers/metrics")
}

export async function getProductMetrics() {
  return proxyFetch<{
    total: number
    categories_count: number
    avg_price_cents: number
    by_category: { category: string; count: number }[]
    by_condition: { condition: string; count: number }[]
  }>("products/metrics")
}

export async function getSalesOrderMetrics(filters?: Partial<FilterState>) {
  return proxyFetch<{
    total: number
    pending_count: number
    accepted_count: number
    delivered_count: number
    acceptance_rate: number
    pending_by_seller: { seller_profile_id: string; seller_name: string; count: number; oldest_date: string }[]
  }>("sales-orders/metrics", dateParams(filters))
}

export async function getSellers(filters?: { page?: number; limit?: number }) {
  return proxyFetch<PaginatedResponse<SellerProfileItem>>("admin/seller-profiles", {
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 100,
  })
}
