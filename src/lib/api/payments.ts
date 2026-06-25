import { parseDashboardDate } from "@/lib/utils"
import type { FilterState, TimeSeriesPoint, PaginatedResponse, Payment, Settlement, Payout } from "@/lib/types"

const BASE = "/api/internal/analytics/payments"

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
    console.error(`[payments-api] ${res.status} ${url}`, body)
    throw new Error(body?.error?.message ?? `Payments API error: ${res.status}`)
  }
  return res.json()
}

/** Wraps proxyFetch and unwraps the common `{ data: T }` envelope used by the Payments API. */
async function proxyFetchData<T>(slug: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const raw = await proxyFetch<{ data: T }>(slug, params)
  return raw.data
}

function dateParams(filters?: Partial<FilterState>) {
  return {
    from: filters?.from instanceof Date ? filters.from.toISOString() : undefined,
    to: filters?.to instanceof Date ? filters.to.toISOString() : undefined,
  }
}

// ── Payments ────────────────────────────────────────────────

export async function getPaymentMetrics(filters?: Partial<FilterState>) {
  return proxyFetchData<{
    total_cents: number
    count: number
    approved_count: number
    avg_order_cents: number
    success_rate: number
  }>("payments/metrics", dateParams(filters))
}

export async function getRevenueTimeSeries(filters?: Partial<FilterState>): Promise<TimeSeriesPoint[]> {
  const data = await proxyFetchData<TimeSeriesPoint[]>("payments/revenue/timeseries", dateParams(filters))
  const now = new Date()
  return (data ?? [])
    .filter((point) => {
      const d = parseDashboardDate(point.date)
      return !isNaN(d.getTime()) && d <= now
    })
    .sort((a, b) => parseDashboardDate(a.date).getTime() - parseDashboardDate(b.date).getTime())
}

export async function getRevenueByDayOfWeek(filters?: Partial<FilterState>) {
  const data = await getRevenueTimeSeries(filters)
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  const buckets = new Map<string, number>()
  for (const point of data) {
    const parsed = parseDashboardDate(point.date)
    if (isNaN(parsed.getTime())) continue
    const dayIndex = parsed.getUTCDay()
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]
    buckets.set(dayName, (buckets.get(dayName) ?? 0) + point.value)
  }
  return days.map((day) => ({ day, value: buckets.get(day) ?? 0 }))
}

export async function getRevenueByMethod(filters?: Partial<FilterState>) {
  return proxyFetchData<{ method: string; value: number; percentage: number }[]>(
    "payments/revenue/by-method",
    dateParams(filters),
  )
}

export async function getRevenueBySeller(filters?: Partial<FilterState>) {
  return proxyFetchData<{ seller_profile_id: string; revenue_cents: number }[]>(
    "payments/revenue/by-seller",
    dateParams(filters),
  )
}

export async function getPayments(filters?: Partial<FilterState> & { page?: number; limit?: number }) {
  return proxyFetch<PaginatedResponse<Payment>>("payments", {
    ...dateParams(filters),
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 100,
  })
}

// ── Settlements ─────────────────────────────────────────────

export async function getSettlementMetrics(filters?: Partial<FilterState>) {
  const [metrics, pendingBySeller] = await Promise.all([
    proxyFetchData<{
      total_cents: number
      fee_cents: number
      net_cents: number
      total_count: number
      pending_count: number
      paid_count: number
      failed_count: number
      manual_review_count: number
      avg_velocity_days: number
    }>("settlements/metrics", dateParams(filters)),
    proxyFetchData<{ seller_profile_id: string; pending_count: number; total_cents: number }[]>(
      "settlements/pending-by-seller",
      dateParams(filters),
    ),
  ])
  return {
    total_cents: metrics.total_cents,
    fee_cents: metrics.fee_cents,
    pending_cents: pendingBySeller.reduce((sum, s) => sum + s.total_cents, 0),
    pending_count: metrics.pending_count,
    paid_count: metrics.paid_count,
    failed_count: metrics.failed_count + metrics.manual_review_count,
    avg_velocity_days: metrics.avg_velocity_days,
  }
}

export async function getCommissionTimeSeries(filters?: Partial<FilterState>): Promise<TimeSeriesPoint[]> {
  const response = await proxyFetch<PaginatedResponse<Settlement>>("settlements", {
    ...dateParams(filters),
    limit: 100,
  })
  const buckets = new Map<string, number>()
  for (const s of response.data) {
    const day = s.created_at.slice(0, 10)
    buckets.set(day, (buckets.get(day) ?? 0) + s.fee_amount_cents)
  }
  const from = filters?.from
  const to = filters?.to
  if (from instanceof Date && to instanceof Date) {
    const result: TimeSeriesPoint[] = []
    const cursor = new Date(from)
    cursor.setHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setHours(0, 0, 0, 0)
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10)
      result.push({ date: key, value: buckets.get(key) ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    return result
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

export async function getSettlementStatusBreakdown(filters?: Partial<FilterState>) {
  return proxyFetchData<{ status: string; count: number }[]>("settlements/status-breakdown", dateParams(filters))
}

export async function getPendingSettlementsBySeller(filters?: Partial<FilterState>) {
  return proxyFetchData<{ seller_profile_id: string; pending_count: number; total_cents: number }[]>(
    "settlements/pending-by-seller",
    dateParams(filters),
  )
}

export async function getSettlements(filters?: Partial<FilterState> & { status?: string; page?: number; limit?: number }) {
  return proxyFetch<PaginatedResponse<Settlement>>("settlements", {
    ...dateParams(filters),
    status: filters?.status,
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 20,
  })
}

// ── Refunds ─────────────────────────────────────────────────

export async function getRefundMetrics(filters?: Partial<FilterState>) {
  return proxyFetchData<{
    total: number
    approved_count: number
    total_amount_cents: number
    by_reason: { reason: string; count: number }[]
  }>("refunds/metrics", dateParams(filters))
}

// ── Payouts ─────────────────────────────────────────────────

export async function getPayoutMetrics(filters?: Partial<FilterState>) {
  const response = await proxyFetch<PaginatedResponse<Settlement>>("settlements", {
    ...dateParams(filters),
    limit: 100,
  })
  const paid = response.data.filter((s) => s.status === "paid")
  const failed = response.data.filter((s) => s.status === "failed" || s.status === "manual_review")
  return {
    total_cents: response.data.reduce((sum, s) => sum + s.net_amount_cents, 0),
    count: response.data.length,
    completed_count: paid.length,
    failed_count: failed.length,
  }
}

export async function getPayouts(filters?: Partial<FilterState> & { page?: number; limit?: number }) {
  const response = await proxyFetch<PaginatedResponse<Settlement>>("settlements", {
    ...dateParams(filters),
    limit: 100,
  })
  const all: Payout[] = response.data.map((s) => ({
    id: `pay_${s.id.slice(4)}`,
    settlement_id: s.id,
    seller_profile_id: s.seller_profile_id,
    seller_name: s.seller_name,
    amount_cents: s.net_amount_cents,
    status: s.status === "paid" ? "completed" : s.status === "pending" ? "pending" : "failed",
    created_at: s.created_at,
    completed_at: s.paid_at,
    attempts: 1,
    last_error: null,
  }))
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 5
  const start = (page - 1) * limit
  return {
    data: all.slice(start, start + limit),
    pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit), hasMore: start + limit < all.length },
  }
}
