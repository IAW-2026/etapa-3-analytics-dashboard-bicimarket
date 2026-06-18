"use client"

import { useQuery } from "@tanstack/react-query"
import { useDashboardStore } from "@/lib/dashboard-store"
import type { FilterState } from "@/lib/mock/types"
import { getPrevFilters } from "@/lib/trends"
import * as paymentsApi from "@/lib/api/payments"
import * as buyerApi from "@/lib/api/buyer"

function getFilters() {
  const s = useDashboardStore.getState()
  return { from: s.from, to: s.to } as FilterState
}

/** Subscribes to date range changes and returns a stable key that changes when the range changes. */
function useDateFilterKey() {
  const from = useDashboardStore((s) => s.from.getTime())
  const to = useDashboardStore((s) => s.to.getTime())
  return [from, to] as const
}

// Temporary local map until Seller App endpoints exist
const SELLER_NAMES = new Map<string, string>([
  ["slp_bicisur", "BiciSur"],
  ["slp_bikear", "BikeAR"],
  ["slp_rodadosxx", "RodadosXX"],
  ["slp_ciclosok", "Ciclos OK"],
  ["slp_mtbhouse", "MTB House"],
  ["slp_urbanride", "Urban Ride"],
  ["slp_bicishop", "BiciShop"],
  ["slp_labici", "La Bici"],
])

function resolveSellerNames<T extends { seller_profile_id: string }>(items: T[]): (T & { seller_name: string })[] {
  return items.map((item) => ({
    ...item,
    seller_name: SELLER_NAMES.get(item.seller_profile_id) ?? item.seller_profile_id,
  }))
}

// ── Payments ────────────────────────────────────────────────

export function useRevenueTimeSeries() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["revenueTimeSeries", ...dateKey],
    queryFn: () => paymentsApi.getRevenueTimeSeries(getFilters()),
    refetchInterval: 60_000,
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function usePaymentMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["paymentMetrics", ...dateKey],
    queryFn: () => paymentsApi.getPaymentMetrics(getFilters()),
    refetchInterval: 60_000,
  })
}

export function useRevenueByDayOfWeek() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["revenueByDayOfWeek", ...dateKey],
    queryFn: () => paymentsApi.getRevenueByDayOfWeek(getFilters()),
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function useRevenueByMethod() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["revenueByMethod", ...dateKey],
    queryFn: () => paymentsApi.getRevenueByMethod(getFilters()),
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function useRevenueBySeller() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["revenueBySeller", ...dateKey],
    queryFn: async () => {
      const data = await paymentsApi.getRevenueBySeller(getFilters())
      return resolveSellerNames(data).sort((a, b) => b.revenue_cents - a.revenue_cents)
    },
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function useRecentPayments() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["recentPayments", ...dateKey],
    queryFn: () => paymentsApi.getPayments({ ...getFilters(), limit: 5 }),
  })
}

// ── Settlements ─────────────────────────────────────────────

export function useSettlementMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["settlementMetrics", ...dateKey],
    queryFn: () => paymentsApi.getSettlementMetrics(getFilters()),
    refetchInterval: 60_000,
  })
}

export function useCommissionTimeSeries() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["commissionTimeSeries", ...dateKey],
    queryFn: () => paymentsApi.getCommissionTimeSeries(getFilters()),
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function useSettlementStatusBreakdown() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["settlementStatusBreakdown", ...dateKey],
    queryFn: () => paymentsApi.getSettlementStatusBreakdown(getFilters()),
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function usePendingSettlementsBySeller() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["pendingSettlementsBySeller", ...dateKey],
    queryFn: async () => {
      const data = await paymentsApi.getPendingSettlementsBySeller(getFilters())
      return resolveSellerNames(data).sort((a, b) => b.total_cents - a.total_cents)
    },
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function useRecentSettlements() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["recentSettlements", ...dateKey],
    queryFn: () =>
      paymentsApi.getSettlements({ ...getFilters(), limit: 5 }),
  })
}

// ── Refunds ─────────────────────────────────────────────────

export function useRefundMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["refundMetrics", ...dateKey],
    queryFn: () => paymentsApi.getRefundMetrics(getFilters()),
  })
}

// ── Payouts ─────────────────────────────────────────────────

export function usePayoutMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["payoutMetrics", ...dateKey],
    queryFn: () => paymentsApi.getPayoutMetrics(getFilters()),
  })
}

export function useRecentPayouts() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["recentPayouts", ...dateKey],
    queryFn: () => paymentsApi.getPayouts({ ...getFilters(), limit: 5 }),
  })
}

// ── Products (aggregated from Payments + mock) ──────────────

export function useTopProductsByRevenue() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["topProductsByRevenue", ...dateKey],
    queryFn: async () => {
      const response = await paymentsApi.getPayments({ ...getFilters(), limit: 100 })
      const approved = response.data.filter((p) => p.status === "approved")
      const productBuckets = new Map<string, { name: string; revenue: number; units: number }>()

      for (const p of approved) {
        for (const group of p.items_summary) {
          for (const item of group.items) {
            const current = productBuckets.get(item.product_id) ?? {
              name: item.product_name_snapshot,
              revenue: 0,
              units: 0,
            }
            current.revenue += item.unit_price_cents * item.quantity
            current.units += item.quantity
            productBuckets.set(item.product_id, current)
          }
        }
      }

      return Array.from(productBuckets.entries())
        .map(([id, info]) => ({ product_id: id, ...info }))
        .sort((a, b) => b.revenue - a.revenue)
    },
  })
}

// ── Prev-period hooks for trend comparison ──────────────────

export function usePrevPaymentMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevPaymentMetrics", ...dateKey],
    queryFn: () => paymentsApi.getPaymentMetrics(getPrevFilters(getFilters())),
  })
}

export function usePrevRevenueTotal() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevRevenueTotal", ...dateKey],
    queryFn: async () => {
      const data = await paymentsApi.getRevenueTimeSeries(getPrevFilters(getFilters()))
      return (Array.isArray(data) ? data : []).reduce((s, p) => s + p.value, 0)
    },
  })
}

export function usePrevSettlementMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevSettlementMetrics", ...dateKey],
    queryFn: () => paymentsApi.getSettlementMetrics(getPrevFilters(getFilters())),
  })
}

export function usePrevCommissionTimeSeries() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevCommissionTimeSeries", ...dateKey],
    queryFn: () => paymentsApi.getCommissionTimeSeries(getPrevFilters(getFilters())),
    select: (data) => (Array.isArray(data) ? data : []) as typeof data,
  })
}

export function usePrevPayoutMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevPayoutMetrics", ...dateKey],
    queryFn: () => paymentsApi.getPayoutMetrics(getPrevFilters(getFilters())),
  })
}

export function usePrevShipmentMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevShipmentMetrics", ...dateKey],
    queryFn: async () => {
      const { getShipmentMetrics } = await import("@/lib/mock/shipments")
      return getShipmentMetrics(getPrevFilters(getFilters()))
    },
  })
}

export function usePrevSalesOrderMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevSalesOrderMetrics", ...dateKey],
    queryFn: async () => {
      const { getSalesOrderMetrics } = await import("@/lib/mock/sales-orders")
      return getSalesOrderMetrics(getPrevFilters(getFilters()))
    },
  })
}

export function usePrevProductMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevProductMetrics", ...dateKey],
    queryFn: async () => {
      const { getProductMetrics } = await import("@/lib/mock/products")
      return getProductMetrics()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePrevSellerMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevSellerMetrics", ...dateKey],
    queryFn: async () => {
      const { getSellerMetrics } = await import("@/lib/mock/sellers")
      return getSellerMetrics()
    },
    staleTime: 60_000,
  })
}

export function usePrevRevenueBySeller() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevRevenueBySeller", ...dateKey],
    queryFn: () => paymentsApi.getRevenueBySeller(getPrevFilters(getFilters())),
  })
}

// ── Mocks (no real API yet) ─────────────────────────────────

export function useProductMetrics() {
  return useQuery({
    queryKey: ["productMetrics"],
    queryFn: async () => {
      const { getProductMetrics } = await import("@/lib/mock/products")
      return getProductMetrics()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useShipmentMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["shipmentMetrics", ...dateKey],
    queryFn: async () => {
      const { getShipmentMetrics } = await import("@/lib/mock/shipments")
      return getShipmentMetrics(getFilters())
    },
    refetchInterval: 60_000,
  })
}

export function useSalesOrderMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["salesOrderMetrics", ...dateKey],
    queryFn: async () => {
      const { getSalesOrderMetrics } = await import("@/lib/mock/sales-orders")
      return getSalesOrderMetrics(getFilters())
    },
    refetchInterval: 60_000,
  })
}

export function useSellerMetrics() {
  return useQuery({
    queryKey: ["sellerMetrics"],
    queryFn: async () => {
      const { getSellerMetrics } = await import("@/lib/mock/sellers")
      return getSellerMetrics()
    },
    staleTime: 60_000,
  })
}

// ── Buyer App ────────────────────────────────────────────────

export function useBuyerMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["buyerMetrics", ...dateKey],
    queryFn: () => buyerApi.getBuyerMetrics(getFilters()),
    refetchInterval: 60_000,
  })
}

export function usePrevBuyerMetrics() {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["prevBuyerMetrics", ...dateKey],
    queryFn: () => buyerApi.getBuyerMetrics(getPrevFilters(getFilters())),
  })
}

export function useBuyers({ limit = 100 }: { limit?: number } = {}) {
  const dateKey = useDateFilterKey()
  return useQuery({
    queryKey: ["buyers", ...dateKey, limit],
    queryFn: () => buyerApi.getBuyers({ ...getFilters(), limit }),
  })
}
