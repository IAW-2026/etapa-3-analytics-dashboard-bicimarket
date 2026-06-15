import { mockData } from "./mock-data"
import type { PaginatedResponse, Refund, FilterState } from "./types"

function filterRefunds(filters?: Partial<FilterState>) {
  let data = [...mockData.refunds]
  if (filters?.from) data = data.filter((r) => new Date(r.created_at) >= filters.from!)
  if (filters?.to) data = data.filter((r) => new Date(r.created_at) <= filters.to!)
  return data
}

export async function getRefunds(
  filters?: Partial<FilterState> & { page?: number; limit?: number },
): Promise<PaginatedResponse<Refund>> {
  const filtered = filterRefunds(filters)
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const start = (page - 1) * limit
  return {
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit), hasMore: start + limit < filtered.length },
  }
}

export async function getRefundMetrics(filters?: Partial<FilterState>) {
  const data = filterRefunds(filters)
  const approved = data.filter((r) => r.status === "approved")
  const byReason = new Map<string, number>()

  for (const r of approved) {
    byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1)
  }

  return {
    total: data.length,
    approved_count: approved.length,
    total_amount_cents: approved.reduce((sum, r) => sum + r.amount_cents, 0),
    by_reason: Array.from(byReason.entries()).map(([reason, count]) => ({ reason, count })),
  }
}
