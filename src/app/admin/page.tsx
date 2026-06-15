"use client"

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { AttentionItems } from "@/components/analytics/attention-items"
import { useRevenueTimeSeries, usePaymentMetrics, useRevenueByDayOfWeek, useSettlementMetrics, useRevenueBySeller, useRefundMetrics } from "@/hooks/use-dashboard-data"
import type { AttentionItem } from "@/lib/mock/types"

function formatARS(cents: number) {
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function ExecutiveOverviewPage() {
  const revenue = useRevenueTimeSeries()
  const metrics = usePaymentMetrics()
  const dayOfWeek = useRevenueByDayOfWeek()
  const settlementMetrics = useSettlementMetrics()
  const topSellers = useRevenueBySeller()
  const refundMetrics = useRefundMetrics()

  const revenueData = revenue.data ?? []
  const totalRevenue = revenueData.reduce((s, p) => s + p.value, 0)
  const daysWithData = revenueData.length
  const prevWeekRevenue = totalRevenue * 0.88
  const revenueGrowth = daysWithData > 0 ? ((totalRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0

  const attentionItems: AttentionItem[] = []
  const paymentMetrics = metrics.data
  if (paymentMetrics && paymentMetrics.success_rate < 90) {
    attentionItems.push({ id: "a1", severity: "critical", title: "Payment success rate low", description: `Current rate is ${paymentMetrics.success_rate.toFixed(1)}%`, link: "/admin/sales" })
  }
  if (settlementMetrics.data && settlementMetrics.data.pending_cents > 50000000) {
    attentionItems.push({ id: "a2", severity: "warning", title: "Pending settlements accumulating", description: `${formatARS(settlementMetrics.data.pending_cents)} due`, link: "/admin/finance" })
  }
  if (refundMetrics.data && refundMetrics.data.approved_count > 5) {
    attentionItems.push({ id: "a3", severity: "info", title: "Recent refunds to review", description: `${refundMetrics.data.approved_count} approved refunds`, link: "/admin/finance" })
  }
  if (attentionItems.length === 0) {
    attentionItems.push({ id: "a4", severity: "info", title: "Marketplace healthy", description: "No anomalies detected in the selected period." })
  }

  const topSellerList = topSellers.data?.slice(0, 5) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Executive Overview" description="High-level snapshot of marketplace health" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="GMV"
          value={formatARS(totalRevenue)}
          trend={{ value: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% WoW`, direction: revenueGrowth >= 0 ? "up" : "down" }}
          isLoading={metrics.isLoading}
        />
        <KpiCard
          label="Orders"
          value={paymentMetrics ? (paymentMetrics.count).toLocaleString("es-AR") : "—"}
          trend={{ value: `+5% WoW`, direction: "up" }}
          isLoading={metrics.isLoading}
        />
        <KpiCard
          label="Success Rate"
          value={paymentMetrics ? `${paymentMetrics.success_rate.toFixed(1)}%` : "—"}
          trend={{ value: "+0.5%", direction: "up" }}
          isLoading={metrics.isLoading}
        />
        <KpiCard
          label="Pending Settlements"
          value={settlementMetrics.data ? formatARS(settlementMetrics.data.pending_cents) : "—"}
          trend={{ value: "+15%", direction: "up", positive: false }}
          isLoading={settlementMetrics.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Revenue Trend"
            isLoading={revenue.isLoading}
            error={revenue.error?.message}
            isEmpty={revenueData.length === 0}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `ARS ${(v / 100000).toFixed(0)}`} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  formatter={(value) => [formatARS(Number(value ?? 0)), "Revenue"]}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="space-y-6">
          <ChartContainer
            title="AI Briefing"
            isLoading={false}
          >
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {paymentMetrics ? `${formatARS(totalRevenue)} generated across ${paymentMetrics.count} orders.` : "Loading..."}
              </p>
              <p className="text-muted-foreground">
                {revenueGrowth >= 0 ? `↑ ${revenueGrowth.toFixed(0)}%` : `↓ ${Math.abs(revenueGrowth).toFixed(0)}%`} vs previous period.
              </p>
              {topSellerList.length > 0 && (
                <p className="text-muted-foreground">
                  Top seller: <span className="font-medium text-foreground">{topSellerList[0].seller_name}</span>
                </p>
              )}
            </div>
          </ChartContainer>

          <ChartContainer
            title="Top Sellers"
            isLoading={topSellers.isLoading}
            error={topSellers.error?.message}
            isEmpty={topSellerList.length === 0}
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
        <AttentionItems items={attentionItems} />

        <ChartContainer
          title="Revenue by Day of Week"
          isLoading={dayOfWeek.isLoading}
          error={dayOfWeek.error?.message}
          isEmpty={dayOfWeek.data?.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayOfWeek.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `ARS ${(v / 100000).toFixed(0)}`} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [formatARS(Number(value ?? 0)), "Revenue"]}
              />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
