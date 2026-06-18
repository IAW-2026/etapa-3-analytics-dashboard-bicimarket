import { mockData } from "./mock-data"
import type { PaginatedResponse, Settlement, FilterState, TimeSeriesPoint } from "./types"

function filterSettlements(filters?: Partial<FilterState> & { status?: string }) {
  let data = [...mockData.settlements]
  if (filters?.from) data = data.filter((s) => new Date(s.created_at) >= filters.from!)
  if (filters?.to) data = data.filter((s) => new Date(s.created_at) <= filters.to!)
  if (filters?.status) data = data.filter((s) => s.status === filters.status)
  return data
}

export async function getSettlements(
  filters?: Partial<FilterState> & { status?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<Settlement>> {
  const filtered = filterSettlements(filters)
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const start = (page - 1) * limit
  return {
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit), hasMore: start + limit < filtered.length },
  }
}

export async function getSettlementsAll(filters?: Partial<FilterState> & { status?: string }): Promise<Settlement[]> {
  return filterSettlements(filters)
}

export async function getSettlementMetrics(filters?: Partial<FilterState>) {
  const data = filterSettlements(filters)
  const pending = data.filter((s) => s.status === "pending")
  const paid = data.filter((s) => s.status === "paid")
  const failed = data.filter((s) => s.status === "failed" || s.status === "manual_review")

  return {
    total_cents: data.reduce((sum, s) => sum + s.gross_amount_cents, 0),
    fee_cents: paid.reduce((sum, s) => sum + s.fee_amount_cents, 0),
    pending_cents: pending.reduce((sum, s) => sum + s.net_amount_cents, 0),
    pending_count: pending.length,
    paid_count: paid.length,
    failed_count: failed.length,
    avg_velocity_days: 4.2,
  }
}

export async function getCommissionTimeSeries(filters?: Partial<FilterState>): Promise<TimeSeriesPoint[]> {
  const data = filterSettlements(filters)
  const paid = data.filter((s) => s.status === "paid")
  const buckets = new Map<string, number>()

  for (const s of paid) {
    const day = s.created_at.slice(0, 10)
    buckets.set(day, (buckets.get(day) ?? 0) + s.fee_amount_cents)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

export async function getSettlementStatusBreakdown(filters?: Partial<FilterState>) {
  const data = filterSettlements(filters)
  const buckets = new Map<string, number>()
  for (const s of data) {
    buckets.set(s.status, (buckets.get(s.status) ?? 0) + 1)
  }
  return Array.from(buckets.entries()).map(([status, count]) => ({ status, count }))
}

export async function getPendingSettlementsBySeller(filters?: Partial<FilterState>) {
  const data = filterSettlements({ ...filters, status: "pending" })
  const buckets = new Map<string, { seller_name: string; total_cents: number }>()

  for (const s of data) {
    const current = buckets.get(s.seller_profile_id) ?? { seller_name: s.seller_name, total_cents: 0 }
    current.total_cents += s.net_amount_cents
    buckets.set(s.seller_profile_id, current)
  }

  return Array.from(buckets.entries())
    .map(([id, info]) => ({ seller_profile_id: id, ...info }))
    .sort((a, b) => b.total_cents - a.total_cents)
}
