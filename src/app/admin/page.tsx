"use client"

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { AttentionItems } from "@/components/analytics/attention-items"
import { useRevenueTimeSeries, usePaymentMetrics, useRevenueByDayOfWeek, useSettlementMetrics, useRevenueBySeller, useRefundMetrics, usePrevRevenueTotal, usePrevPaymentMetrics, usePrevSettlementMetrics } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"
import { formatCompactARS, formatDateLabel } from "@/lib/utils"
import type { AttentionItem } from "@/lib/types"

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function ExecutiveOverviewPage() {
  const revenue = useRevenueTimeSeries()
  const metrics = usePaymentMetrics()
  const dayOfWeek = useRevenueByDayOfWeek()
  const settlementMetrics = useSettlementMetrics()
  const topSellers = useRevenueBySeller()
  const refundMetrics = useRefundMetrics()
  const prevRevenue = usePrevRevenueTotal()
  const prevMetrics = usePrevPaymentMetrics()
  const prevSettlementMetrics = usePrevSettlementMetrics()

  const revenueData = revenue.data ?? []
  const totalRevenue = revenueData.reduce((s, p) => s + p.value, 0)
  const gmvTrend = computeTrend(prevRevenue.data, totalRevenue)
  const ordersTrend = computeTrend(prevMetrics.data?.count, metrics.data?.count)
  const successRateTrend = computeTrend(prevMetrics.data?.success_rate, metrics.data?.success_rate)
  const pendingLiqTrend = computeTrend(prevSettlementMetrics.data?.pending_cents, settlementMetrics.data?.pending_cents)

  const attentionItems: AttentionItem[] = []
  const paymentMetrics = metrics.data
  if (paymentMetrics && paymentMetrics.success_rate < 90) {
    attentionItems.push({ id: "a1", severity: "critical", title: "Tasa de éxito de pagos baja", description: `Tasa actual: ${paymentMetrics.success_rate.toFixed(1)}%`, link: "/admin/sales" })
  }
  if (settlementMetrics.data && settlementMetrics.data.pending_cents > 50000000) {
    attentionItems.push({ id: "a2", severity: "warning", title: "Liquidaciones pendientes acumulándose", description: `${formatARS(settlementMetrics.data.pending_cents)} pendientes`, link: "/admin/finance" })
  }
  if (refundMetrics.data && refundMetrics.data.approved_count > 5) {
    attentionItems.push({ id: "a3", severity: "info", title: "Reembolsos recientes por revisar", description: `${refundMetrics.data.approved_count} reembolsos aprobados`, link: "/admin/finance" })
  }
  if (attentionItems.length === 0) {
    attentionItems.push({ id: "a4", severity: "info", title: "Marketplace saludable", description: "No se detectaron anomalías en el período seleccionado." })
  }

  const topSellerList = topSellers.data?.slice(0, 5) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Panel General" description="Resumen general del estado del marketplace" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="GMV"
          value={formatARS(totalRevenue)}
          trend={gmvTrend ? { value: gmvTrend.label, direction: gmvTrend.direction } : undefined}
          isLoading={metrics.isLoading}
          dataSources={["payments"]}
        />
        <KpiCard
          label="Órdenes"
          value={paymentMetrics?.count != null ? paymentMetrics.count.toLocaleString("es-AR") : "—"}
          trend={ordersTrend ? { value: ordersTrend.label, direction: ordersTrend.direction } : undefined}
          isLoading={metrics.isLoading}
          dataSources={["payments"]}
        />
        <KpiCard
          label="Tasa de Éxito"
          value={paymentMetrics?.success_rate != null ? `${paymentMetrics.success_rate.toFixed(1)}%` : "—"}
          trend={successRateTrend ? { value: successRateTrend.label, direction: successRateTrend.direction } : undefined}
          isLoading={metrics.isLoading}
          dataSources={["payments"]}
        />
        <KpiCard
          label="Liquidaciones Pendientes"
          value={settlementMetrics.data ? formatARS(settlementMetrics.data.pending_cents) : "—"}
          trend={pendingLiqTrend ? { value: pendingLiqTrend.label, direction: pendingLiqTrend.direction, positive: false } : undefined}
          isLoading={settlementMetrics.isLoading}
          dataSources={["payments"]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Tendencia de Ingresos"
            isLoading={revenue.isLoading}
            error={revenue.error?.message}
            isEmpty={revenueData.length === 0}
            dataSources={["payments"]}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData} margin={{ top: 12 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDateLabel(v)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactARS(v)} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="space-y-6">
          <ChartContainer
            title="Resumen"
            isLoading={false}
            dataSources={["payments", "seller"]}
          >
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {paymentMetrics ? `${formatARS(totalRevenue)} generados en ${paymentMetrics.count} órdenes.` : "Cargando..."}
              </p>

              {topSellerList.length > 0 && (
                <p className="text-muted-foreground">
                  Mejor vendedor: <span className="font-medium text-foreground">{topSellerList[0].seller_name}</span>
                </p>
              )}
            </div>
          </ChartContainer>

          <ChartContainer
            title="Mejores Vendedores"
            isLoading={topSellers.isLoading}
            error={topSellers.error?.message}
            isEmpty={topSellerList.length === 0}
            dataSources={["payments", "seller"]}
          >
            <div className="space-y-2">
              {topSellerList.map((seller, idx) => (
                <div key={seller.seller_profile_id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-medium text-muted-foreground">#{idx + 1}</span>
                  <span className="flex-1 truncate text-sm">{seller.seller_name}</span>
                  <span className="text-sm font-medium">{formatARS(seller.revenue_cents)}</span>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AttentionItems items={attentionItems} dataSources={["payments"]} />

        <ChartContainer
          title="Ingresos por Día de la Semana"
          isLoading={dayOfWeek.isLoading}
          error={dayOfWeek.error?.message}
          isEmpty={dayOfWeek.data?.length === 0}
          dataSources={["payments"]}
        >
          <div className="flex flex-col h-full min-h-[240px]">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeek.data} margin={{ top: 12, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactARS(v)} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]}
              />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
            </div>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
