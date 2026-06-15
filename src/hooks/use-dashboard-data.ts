"use client"

import { useQuery } from "@tanstack/react-query"
import { useDashboardStore } from "@/lib/dashboard-store"
import type { FilterState } from "@/lib/mock/types"

function getFilters() {
  const { from, to } = useDashboardStore.getState()
  return { from, to } as FilterState
}

export function useRevenueTimeSeries() {
  return useQuery({
    queryKey: ["revenueTimeSeries", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getRevenueTimeSeries } = await import("@/lib/mock/payments")
      return getRevenueTimeSeries(getFilters())
    },
    refetchInterval: 60_000,
  })
}

export function usePaymentMetrics() {
  return useQuery({
    queryKey: ["paymentMetrics", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getPaymentMetrics } = await import("@/lib/mock/payments")
      return getPaymentMetrics(getFilters())
    },
    refetchInterval: 60_000,
  })
}

export function useRevenueByDayOfWeek() {
  return useQuery({
    queryKey: ["revenueByDayOfWeek", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getRevenueByDayOfWeek } = await import("@/lib/mock/payments")
      return getRevenueByDayOfWeek(getFilters())
    },
  })
}

export function useRevenueByMethod() {
  return useQuery({
    queryKey: ["revenueByMethod", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getRevenueByMethod } = await import("@/lib/mock/payments")
      return getRevenueByMethod(getFilters())
    },
  })
}

export function useRevenueBySeller() {
  return useQuery({
    queryKey: ["revenueBySeller", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getRevenueBySeller } = await import("@/lib/mock/payments")
      return getRevenueBySeller(getFilters())
    },
  })
}

export function useSettlementMetrics() {
  return useQuery({
    queryKey: ["settlementMetrics", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getSettlementMetrics } = await import("@/lib/mock/settlements")
      return getSettlementMetrics(getFilters())
    },
    refetchInterval: 60_000,
  })
}

export function useCommissionTimeSeries() {
  return useQuery({
    queryKey: ["commissionTimeSeries", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getCommissionTimeSeries } = await import("@/lib/mock/settlements")
      return getCommissionTimeSeries(getFilters())
    },
  })
}

export function useSettlementStatusBreakdown() {
  return useQuery({
    queryKey: ["settlementStatusBreakdown", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getSettlementStatusBreakdown } = await import("@/lib/mock/settlements")
      return getSettlementStatusBreakdown(getFilters())
    },
  })
}

export function usePendingSettlementsBySeller() {
  return useQuery({
    queryKey: ["pendingSettlementsBySeller", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getPendingSettlementsBySeller } = await import("@/lib/mock/settlements")
      return getPendingSettlementsBySeller(getFilters())
    },
  })
}

export function useRecentSettlements() {
  return useQuery({
    queryKey: ["recentSettlements", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getSettlements } = await import("@/lib/mock/settlements")
      return getSettlements({ ...getFilters(), limit: 5 })
    },
  })
}

export function useRefundMetrics() {
  return useQuery({
    queryKey: ["refundMetrics", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getRefundMetrics } = await import("@/lib/mock/refunds")
      return getRefundMetrics(getFilters())
    },
  })
}

export function usePayoutMetrics() {
  return useQuery({
    queryKey: ["payoutMetrics", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getPayoutMetrics } = await import("@/lib/mock/payouts")
      return getPayoutMetrics(getFilters())
    },
  })
}

export function useRecentPayouts() {
  return useQuery({
    queryKey: ["recentPayouts", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getPayouts } = await import("@/lib/mock/payouts")
      return getPayouts({ ...getFilters(), limit: 5 })
    },
  })
}

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
  return useQuery({
    queryKey: ["shipmentMetrics", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getShipmentMetrics } = await import("@/lib/mock/shipments")
      return getShipmentMetrics(getFilters())
    },
    refetchInterval: 60_000,
  })
}

export function useSalesOrderMetrics() {
  return useQuery({
    queryKey: ["salesOrderMetrics", useDashboardStore.getState().preset],
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

export function useTopProductsByRevenue() {
  return useQuery({
    queryKey: ["topProductsByRevenue", useDashboardStore.getState().preset],
    queryFn: async () => {
      const { getPaymentsAll } = await import("@/lib/mock/payments")
      const payments = await getPaymentsAll(getFilters())
      const approved = payments.filter((p) => p.status === "approved")
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
