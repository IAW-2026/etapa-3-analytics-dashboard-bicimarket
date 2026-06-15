import { mockData } from "@/lib/mock/mock-data"

export type ServiceOverview = {
  app: string
  label: string
  configured: boolean
  online: boolean
  total: number | null
  error: string | null
}

export async function getMarketplaceOverview() {
  const services: ServiceOverview[] = [
    {
      app: "buyer",
      label: "Buyer App",
      configured: true,
      online: true,
      total: mockData.buyers.length,
      error: null,
    },
    {
      app: "seller",
      label: "Seller App",
      configured: true,
      online: true,
      total: mockData.sellers.length,
      error: null,
    },
    {
      app: "payments",
      label: "Payments App",
      configured: true,
      online: true,
      total: mockData.payments.length,
      error: null,
    },
    {
      app: "shipping",
      label: "Shipping App",
      configured: true,
      online: true,
      total: mockData.shipments.length,
      error: null,
    },
  ]

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
