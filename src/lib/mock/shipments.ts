import { mockData } from "./mock-data"
import type { PaginatedResponse, Shipment, FilterState } from "./types"

function filterShipments(filters?: Partial<FilterState> & { status?: string }) {
  let data = [...mockData.shipments]
  if (filters?.from) data = data.filter((s) => new Date(s.created_at) >= filters.from!)
  if (filters?.to) data = data.filter((s) => new Date(s.created_at) <= filters.to!)
  if (filters?.status) data = data.filter((s) => s.status === filters.status)
  return data
}

export async function getShipments(
  filters?: Partial<FilterState> & { status?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<Shipment>> {
  const filtered = filterShipments(filters)
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const start = (page - 1) * limit
  return {
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit), hasMore: start + limit < filtered.length },
  }
}

export async function getShipmentMetrics(filters?: Partial<FilterState>) {
  const data = filterShipments(filters)
  const delivered = data.filter((s) => s.status === "delivered")
  const inTransit = data.filter((s) => ["in_transit", "out_for_delivery", "picked_up", "ready_for_pickup"].includes(s.status))
  const failed = data.filter((s) => s.status === "failed_delivery")

  const avgDeliveryTime = delivered.reduce((sum, s) => {
    if (!s.delivered_at || !s.created_at) return sum
    const created = new Date(s.created_at).getTime()
    const delivered_time = new Date(s.delivered_at).getTime()
    return sum + (delivered_time - created) / (1000 * 60 * 60 * 24)
  }, 0) / (delivered.length || 1)

  const backlogByStatus = new Map<string, number>()
  for (const s of inTransit) {
    backlogByStatus.set(s.status, (backlogByStatus.get(s.status) ?? 0) + 1)
  }

  return {
    total: data.length,
    delivered_count: delivered.length,
    in_transit_count: inTransit.length,
    failed_count: failed.length,
    fulfillment_rate: data.length > 0 ? (delivered.length / data.length) * 100 : 0,
    avg_delivery_time_days: Math.round(avgDeliveryTime * 10) / 10,
    backlog_by_status: Array.from(backlogByStatus.entries()).map(([status, count]) => ({ status, count })),
  }
}
