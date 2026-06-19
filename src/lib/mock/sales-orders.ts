import { mockData } from "./mock-data"
import type { PaginatedResponse, SalesOrder, FilterState } from "./types"

function filterSalesOrders(filters?: Partial<FilterState> & { fulfillment_status?: string }) {
  let data = [...mockData.salesOrders]
  if (filters?.from) data = data.filter((o) => new Date(o.created_at) >= filters.from!)
  if (filters?.to) data = data.filter((o) => new Date(o.created_at) <= filters.to!)
  if (filters?.fulfillment_status) data = data.filter((o) => o.fulfillment_status === filters.fulfillment_status)
  return data
}

export async function getSalesOrders(
  filters?: Partial<FilterState> & { fulfillment_status?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<SalesOrder>> {
  const filtered = filterSalesOrders(filters)
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const start = (page - 1) * limit
  return {
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, total_pages: Math.ceil(filtered.length / limit), has_more: start + limit < filtered.length },
  }
}

export async function getSalesOrderMetrics(filters?: Partial<FilterState>) {
  const data = filterSalesOrders(filters)
  const pending = data.filter((o) => o.fulfillment_status === "pending")
  const accepted = data.filter((o) => !["pending", "rejected", "cancelled"].includes(o.fulfillment_status))
  const delivered = data.filter((o) => o.fulfillment_status === "delivered")

  return {
    total: data.length,
    pending_count: pending.length,
    accepted_count: accepted.length,
    delivered_count: delivered.length,
    acceptance_rate: data.length > 0 ? (accepted.length / data.length) * 100 : 0,
    pending_by_seller: aggregatePendingBySeller(pending),
  }
}

function aggregatePendingBySeller(pending: SalesOrder[]) {
  const map = new Map<string, { seller_name: string; count: number; oldest_date: string }>()
  for (const o of pending) {
    const current = map.get(o.seller_profile_id) ?? {
      seller_name: o.seller_name,
      count: 0,
      oldest_date: o.created_at,
    }
    current.count++
    if (o.created_at < current.oldest_date) current.oldest_date = o.created_at
    map.set(o.seller_profile_id, current)
  }
  return Array.from(map.entries())
    .map(([id, info]) => ({ seller_profile_id: id, ...info }))
    .sort((a, b) => b.count - a.count)
}
