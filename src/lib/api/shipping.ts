import type { FilterState, PaginatedResponse, Shipment } from "@/lib/types"

const BASE = "/api/internal/analytics/shipping"

type QueryParams = Record<string, string | number | undefined>

async function proxyFetch<T>(slug: string, params?: QueryParams): Promise<T> {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  const url = query ? `${BASE}/${slug}?${query}` : `${BASE}/${slug}`
  const response = await fetch(url)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    console.error(`[shipping-api] ${response.status} ${url}`, body)
    throw new Error(body?.error?.message ?? `Shipping API error: ${response.status}`)
  }

  return response.json()
}

function dateParams(filters?: Partial<FilterState>) {
  return {
    from: filters?.from instanceof Date ? filters.from.toISOString() : undefined,
    to: filters?.to instanceof Date ? filters.to.toISOString() : undefined,
  }
}

export interface ShipmentMetrics {
  total: number
  delivered_count: number
  in_transit_count: number
  failed_count: number
  fulfillment_rate: number
  avg_delivery_time_days: number
  backlog_by_status: { status: Shipment["status"]; count: number }[]
}

export type ShipmentFilters = Partial<FilterState> & {
  status?: Shipment["status"]
  page?: number
  limit?: number
}

export function getShipments(filters?: ShipmentFilters) {
  return proxyFetch<PaginatedResponse<Shipment>>("shipments", {
    ...dateParams(filters),
    status: filters?.status,
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 20,
  })
}

export function getShipmentMetrics(filters?: Partial<FilterState>) {
  return proxyFetch<ShipmentMetrics>("shipments/metrics", dateParams(filters))
}
