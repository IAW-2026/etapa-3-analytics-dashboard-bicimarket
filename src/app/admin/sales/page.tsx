"use client"

import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { usePaymentMetrics, useRevenueTimeSeries, useRevenueByDayOfWeek, useRevenueByMethod, useRevenueBySeller, usePrevPaymentMetrics, usePrevRevenueTotal } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"
import { translateMethod } from "@/lib/labels"

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

  const revenueData = revenue.data ?? []
  const totalRevenue = revenueData.reduce((s, p) => s + p.value, 0)
  const ingresosTrend = computeTrend(prevRevenue.data, totalRevenue)
  const ordersTrend = computeTrend(prevMetrics.data?.count, metrics.data?.count)
  const ticketTrend = computeTrend(prevMetrics.data?.avg_order_cents, metrics.data?.avg_order_cents)

  const methodData = byMethod.data?.map((m) => ({
    ...m,
    label: translateMethod(m.method),
  })) ?? []

  const sellerData = topSellers.data?.slice(0, 10) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Analítica de Ventas" description="Ingresos, órdenes y rendimiento de ventas" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ingresos" value={formatARS(totalRevenue)} trend={ingresosTrend ? { value: ingresosTrend.label, direction: ingresosTrend.direction } : undefined} isLoading={metrics.isLoading} />
        <KpiCard label="Órdenes" value={metrics.data?.count != null ? metrics.data.count.toLocaleString("es-AR") : "—"} trend={ordersTrend ? { value: ordersTrend.label, direction: ordersTrend.direction } : undefined} isLoading={metrics.isLoading} />
        <KpiCard label="Ticket Promedio" value={metrics.data ? formatARS(metrics.data.avg_order_cents) : "—"} trend={ticketTrend ? { value: ticketTrend.label, direction: ticketTrend.direction } : undefined} isLoading={metrics.isLoading} />
        <KpiCard label="Crecimiento" value={ingresosTrend?.label ?? "—"} trend={ingresosTrend ? { value: ingresosTrend.label, direction: ingresosTrend.direction } : undefined} isLoading={metrics.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartContainer             title="Ingresos en el Tiempo" isLoading={revenue.isLoading} error={revenue.error?.message} isEmpty={revenueData.length === 0}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="salesRevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `ARS ${(v / 100000).toFixed(0)}`} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]} />
                <Area type="monotone" dataKey="value" stroke="var(--color-chart-1)" fill="url(#salesRevGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div>
          <ChartContainer             title="Ingresos por Método" isLoading={byMethod.isLoading} error={byMethod.error?.message} isEmpty={methodData.length === 0}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={methodData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="label" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {methodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer             title="Ingresos por Vendedor (Top 10)" isLoading={topSellers.isLoading} error={topSellers.error?.message} isEmpty={sellerData.length === 0}>
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

        <ChartContainer title="Ingresos por Día de la Semana" isLoading={dayOfWeek.isLoading} error={dayOfWeek.error?.message} isEmpty={dayOfWeek.data?.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dayOfWeek.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `ARS ${(v / 100000).toFixed(0)}`} className="text-muted-foreground" />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]} />
              <Bar dataKey="value" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
