import { mockData } from "./mock-data"
import type { PaginatedResponse, Payout, FilterState } from "./types"

function filterPayouts(filters?: Partial<FilterState>) {
  let data = [...mockData.payouts]
  if (filters?.from) data = data.filter((p) => new Date(p.created_at) >= filters.from!)
  if (filters?.to) data = data.filter((p) => new Date(p.created_at) <= filters.to!)
  return data
}

export async function getPayouts(
  filters?: Partial<FilterState> & { page?: number; limit?: number },
): Promise<PaginatedResponse<Payout>> {
  const filtered = filterPayouts(filters)
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 5
  const start = (page - 1) * limit
  return {
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit), hasMore: start + limit < filtered.length },
  }
}

export async function getPayoutMetrics(filters?: Partial<FilterState>) {
  const data = filterPayouts(filters)
  const completed = data.filter((p) => p.status === "completed")
  const failed = data.filter((p) => p.status === "failed")

  return {
    total_cents: completed.reduce((sum, p) => sum + p.amount_cents, 0),
    count: data.length,
    completed_count: completed.length,
    failed_count: failed.length,
  }
}
