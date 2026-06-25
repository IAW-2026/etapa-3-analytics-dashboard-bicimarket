"use client"

import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ExecutiveHealthCard } from "@/components/analytics/executive-health-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { usePaymentMetrics, useRevenueTimeSeries, useRevenueByDayOfWeek, useRevenueByMethod, useRevenueBySeller, usePrevPaymentMetrics, usePrevRevenueTotal } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"
import { translateMethod, translateStatus } from "@/lib/labels"
import { formatCompactARS, formatDateLabel } from "@/lib/utils"
import { calculateHealth, trendHealth } from "@/lib/health-score"
import { useQuery } from "@tanstack/react-query"
import * as paymentsApi from "@/lib/api/payments"

const STATUS_COLORS: Record<string, string> = {
  approved: "var(--color-chart-1)",
  rejected: "var(--color-chart-4)",
  cancelled: "var(--color-chart-5)",
  refunded: "var(--color-chart-3)",
  pending: "var(--color-chart-2)",
}

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function SalesAnalyticsPage() {
  const metrics = usePaymentMetrics()
  const revenue = useRevenueTimeSeries()
  const dayOfWeek = useRevenueByDayOfWeek()
  const byMethod = useRevenueByMethod()
  const topSellers = useRevenueBySeller()
  const prevMetrics = usePrevPaymentMetrics()
  const prevRevenue = usePrevRevenueTotal()

  const { data: statusBreakdown } = useQuery({
    queryKey: ["paymentStatusBreakdown"],
    queryFn: async () => {
      const response = await paymentsApi.getPayments({ limit: 100 })
      const statusCounts = new Map<string, number>()
      for (const p of response.data) {
        statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1)
      }
      return Array.from(statusCounts.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
    },
  })

  const revenueData = revenue.data ?? []
  const totalRevenue = revenueData.reduce((s, p) => s + p.value, 0)
  const ingresosTrend = computeTrend(prevRevenue.data, totalRevenue)
  const ordersTrend = computeTrend(prevMetrics.data?.count, metrics.data?.count)
  const ticketTrend = computeTrend(prevMetrics.data?.avg_order_cents, metrics.data?.avg_order_cents)
  const revenueHealth = trendHealth(prevRevenue.data, totalRevenue)
  const ordersHealth = trendHealth(prevMetrics.data?.count, metrics.data?.count)
  const salesHealth = calculateHealth([
    { value: metrics.data?.success_rate, weight: 70, critical: true },
    { value: revenueHealth, weight: 15 },
    { value: ordersHealth, weight: 15 },
  ])
  const salesNeedsAction = salesHealth && ["urgent", "alert", "attention"].includes(salesHealth.status)

  const methodData = byMethod.data?.map((m) => ({
    ...m,
    label: translateMethod(m.method),
  })) ?? []

  const sellerData = topSellers.data?.slice(0, 10) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Analítica de Ventas" description="Ingresos, órdenes y rendimiento de ventas" />

      <ExecutiveHealthCard
        section="Ventas"
        result={salesHealth}
        sources={["payments"]}
        isLoading={metrics.isLoading || revenue.isLoading || prevRevenue.isLoading}
        error={metrics.error?.message ?? revenue.error?.message}
        summary={metrics.data ? `${metrics.data.approved_count.toLocaleString("es-AR")} de ${metrics.data.count.toLocaleString("es-AR")} pagos fueron aprobados en el período.` : "Sin información suficiente para evaluar las ventas."}
        recommendation={salesNeedsAction ? "Priorizar la recuperación de pagos rechazados y revisar la caída de ingresos u órdenes." : "Sostener la conversión y profundizar los canales y vendedores con mayor crecimiento."}
        metrics={[
          { label: "Éxito de pagos", value: metrics.data ? `${metrics.data.success_rate.toFixed(1)}%` : "—" },
          { label: "Evolución de ingresos", value: ingresosTrend?.label ?? "Sin comparación" },
          { label: "Evolución de órdenes", value: ordersTrend?.label ?? "Sin comparación" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ingresos" value={formatARS(totalRevenue)} trend={ingresosTrend ? { value: ingresosTrend.label, direction: ingresosTrend.direction } : undefined} isLoading={metrics.isLoading} dataSources={["payments"]} />
        <KpiCard label="Órdenes" value={metrics.data?.count != null ? metrics.data.count.toLocaleString("es-AR") : "—"} trend={ordersTrend ? { value: ordersTrend.label, direction: ordersTrend.direction } : undefined} isLoading={metrics.isLoading} dataSources={["payments"]} />
        <KpiCard label="Ticket Promedio" value={metrics.data ? formatARS(metrics.data.avg_order_cents) : "—"} trend={ticketTrend ? { value: ticketTrend.label, direction: ticketTrend.direction } : undefined} isLoading={metrics.isLoading} dataSources={["payments"]} />
        <KpiCard label="Crecimiento" value={ingresosTrend?.label ?? "—"} trend={ingresosTrend ? { value: ingresosTrend.label, direction: ingresosTrend.direction } : undefined} isLoading={metrics.isLoading} dataSources={["payments"]} />
      </div>

      {statusBreakdown && statusBreakdown.length > 0 && (
        <ChartContainer title="Distribución de Estados de Pago" dataSources={["payments"]}>
          <div className="space-y-2">
            <div className="flex h-6 w-full overflow-hidden rounded-full">
              {(() => {
                const totalStatus = statusBreakdown.reduce((s, e) => s + e.count, 0)
                return statusBreakdown.map((e) => (
                  <div
                    key={e.status}
                    className="h-full transition-all"
                    style={{
                      width: `${(e.count / totalStatus) * 100}%`,
                      backgroundColor: STATUS_COLORS[e.status] ?? "var(--color-chart-5)",
                    }}
                  />
                ))
              })()}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {statusBreakdown.map((e) => {
                const totalStatus = statusBreakdown.reduce((s, e) => s + e.count, 0)
                return (
                  <div key={e.status} className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[e.status] ?? "var(--color-chart-5)" }}
                    />
                    <span className="text-muted-foreground">{translateStatus(e.status)}</span>
                    <span className="font-medium">{((e.count / totalStatus) * 100).toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </ChartContainer>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartContainer title="Ingresos en el Tiempo" isLoading={revenue.isLoading} error={revenue.error?.message} isEmpty={revenueData.length === 0} dataSources={["payments"]}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="salesRevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDateLabel(v)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactARS(v)} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]} />
                <Area type="monotone" dataKey="value" stroke="var(--color-chart-1)" fill="url(#salesRevGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div>
          <ChartContainer title="Ingresos por Método" isLoading={byMethod.isLoading} error={byMethod.error?.message} isEmpty={methodData.length === 0} dataSources={["payments"]}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={methodData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} minAngle={10} dataKey="value" nameKey="label" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {methodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]} />
                <Legend wrapperStyle={{ fontSize: "12px" }} formatter={(value: string) => <span className="text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Ingresos por Vendedor (Top 10)" isLoading={topSellers.isLoading} error={topSellers.error?.message} isEmpty={sellerData.length === 0} dataSources={["payments", "seller"]}>
          <div className="space-y-3">
            {sellerData.map((seller, idx) => {
              const maxRevenue = sellerData[0]?.revenue_cents ?? 1
              const pct = (seller.revenue_cents / maxRevenue) * 100
              return (
                <div key={seller.seller_profile_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-xs text-muted-foreground">#{idx + 1}</span>
                      <span className="font-medium">{seller.seller_name}</span>
                    </span>
                    <span className="text-muted-foreground">{formatARS(seller.revenue_cents)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-1 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartContainer>

        <ChartContainer title="Ingresos por Día de la Semana" isLoading={dayOfWeek.isLoading} error={dayOfWeek.error?.message} isEmpty={dayOfWeek.data?.length === 0} dataSources={["payments"]}>
          <div className="flex flex-col h-full min-h-[240px]">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeek.data} margin={{ top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactARS(v)} className="text-muted-foreground" />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]} />
              <Bar dataKey="value" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
