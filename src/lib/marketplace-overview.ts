import * as buyerApi from "@/lib/api/buyer"
import * as sellerApi from "@/lib/api/seller"
import * as paymentsApi from "@/lib/api/payments"
import * as shippingApi from "@/lib/api/shipping"

export type ServiceOverview = {
  app: string
  label: string
  configured: boolean
  online: boolean
  total: number | null
  error: string | null
}

async function fetchServiceOverview<T>(
  app: string,
  label: string,
  fetcher: () => Promise<T>,
  extractTotal: (data: T) => number,
): Promise<ServiceOverview> {
  try {
    const data = await fetcher()
    return { app, label, configured: true, online: true, total: extractTotal(data), error: null }
  } catch (err) {
    return {
      app,
      label,
      configured: true,
      online: false,
      total: null,
      error: err instanceof Error ? err.message : "Error desconocido",
    }
  }
}

export async function getMarketplaceOverview() {
  const results = await Promise.allSettled([
    fetchServiceOverview("buyer", "Buyer App", () => buyerApi.getBuyerMetrics({}), (d) => d.total),
    fetchServiceOverview("seller", "Seller App", () => sellerApi.getSellerMetrics(), (d) => d.total),
    fetchServiceOverview("payments", "Payments App", () => paymentsApi.getPaymentMetrics({}), (d) => d.count),
    fetchServiceOverview("shipping", "Shipping App", () => shippingApi.getShipmentMetrics({}), (d) => d.total),
  ])

  const services: ServiceOverview[] = results.map((r) =>
    r.status === "fulfilled" ? r.value : { app: "unknown", label: "Servicio", configured: false, online: false, total: null, error: "Error de conexión" },
  )

  return {
    services,
    online: services.filter((s) => s.online).length,
    configured: services.filter((s) => s.configured).length,
    generatedAt: new Date().toISOString(),
  }
}

export function normalizeCollection(payload: unknown): {
  data: Record<string, unknown>[]
  total: number
} {
  if (!payload || typeof payload !== "object") return { data: [], total: 0 }
  const record = payload as Record<string, unknown>
  const data = Array.isArray(record.data)
    ? record.data.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : []

  return { data, total: data.length }
}
