import { mockData } from "./mock-data"
import type { PaginatedResponse, Payment, FilterState, TimeSeriesPoint } from "./types"

function filterPayments(filters?: Partial<FilterState>) {
  let data = [...mockData.payments]
  if (filters?.from) data = data.filter((p) => new Date(p.created_at) >= filters.from!)
  if (filters?.to) data = data.filter((p) => new Date(p.created_at) <= filters.to!)
  return data
}

export async function getPayments(
  filters?: Partial<FilterState> & { page?: number; limit?: number },
): Promise<PaginatedResponse<Payment>> {
  const filtered = filterPayments(filters)
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const start = (page - 1) * limit
  return {
    data: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / limit),
      has_more: start + limit < filtered.length,
    },
  }
}

export async function getPaymentsAll(
  filters?: Partial<FilterState>,
): Promise<Payment[]> {
  return filterPayments(filters)
}

export async function getPaymentMetrics(filters?: Partial<FilterState>) {
  const data = filterPayments(filters)
  const approved = data.filter((p) => p.status === "approved")
  const totalCents = approved.reduce((sum, p) => sum + p.amount_cents, 0)
  return {
    total_cents: totalCents,
    count: data.length,
    approved_count: approved.length,
    avg_order_cents: approved.length > 0 ? Math.round(totalCents / approved.length) : 0,
    success_rate: data.length > 0 ? (approved.length / data.length) * 100 : 0,
  }
}

export async function getRevenueTimeSeries(
  filters?: Partial<FilterState>,
): Promise<TimeSeriesPoint[]> {
  const data = filterPayments(filters)
  const approved = data.filter((p) => p.status === "approved")
  const buckets = new Map<string, number>()

  for (const p of approved) {
    const day = p.created_at.slice(0, 10)
    buckets.set(day, (buckets.get(day) ?? 0) + p.amount_cents)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

export async function getRevenueByDayOfWeek(filters?: Partial<FilterState>) {
  const data = filterPayments(filters)
  const approved = data.filter((p) => p.status === "approved")
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const buckets = new Map<string, number>()

  for (const p of approved) {
    const dayIndex = new Date(p.created_at).getDay()
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]
    buckets.set(dayName, (buckets.get(dayName) ?? 0) + p.amount_cents)
  }

  return days.map((day) => ({ day, value: buckets.get(day) ?? 0 }))
}

export async function getRevenueByMethod(filters?: Partial<FilterState>) {
  const data = filterPayments(filters)
  const approved = data.filter((p) => p.status === "approved")
  const buckets = new Map<string, number>()

  for (const p of approved) {
    buckets.set(p.method, (buckets.get(p.method) ?? 0) + p.amount_cents)
  }

  return Array.from(buckets.entries()).map(([method, value]) => ({
    method,
    value,
    percentage: 0,
  }))
}

export async function getRevenueBySeller(filters?: Partial<FilterState>) {
  const data = filterPayments(filters)
  const approved = data.filter((p) => p.status === "approved")
  const buckets = new Map<string, { revenue: number; seller_profile_id: string }>()

  for (const p of approved) {
    for (const group of p.items_summary) {
      const current = buckets.get(group.seller_profile_id) ?? {
        revenue: 0,
        seller_profile_id: group.seller_profile_id,
      }
      current.revenue += group.subtotal_cents + group.shipping_cost_cents
      buckets.set(group.seller_profile_id, current)
    }
  }

  const sellerNames = new Map(
    mockData.sellers.map((s) => [s.id, s.display_name]),
  )

  return Array.from(buckets.entries())
    .map(([id, info]) => ({
      seller_profile_id: id,
      seller_name: sellerNames.get(id) ?? id,
      revenue_cents: info.revenue,
    }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
}
