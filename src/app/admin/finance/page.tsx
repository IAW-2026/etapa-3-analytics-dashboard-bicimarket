"use client"

import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { StatusBadge } from "@/components/analytics/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSettlementMetrics, useCommissionTimeSeries, useSettlementStatusBreakdown, usePendingSettlementsBySeller, useRecentSettlements, usePayoutMetrics, useRecentPayouts } from "@/hooks/use-dashboard-data"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number) {
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function FinanceDashboardPage() {
  const settlementMetrics = useSettlementMetrics()
  const commission = useCommissionTimeSeries()
  const statusBreakdown = useSettlementStatusBreakdown()
  const pendingBySeller = usePendingSettlementsBySeller()
  const recentSettlements = useRecentSettlements()
  const payoutMetrics = usePayoutMetrics()
  const recentPayouts = useRecentPayouts()

  const commissionData = commission.data ?? []
  const totalCommission = commissionData.reduce((s, p) => s + p.value, 0)
  const settlementData = settlementMetrics.data
  const statusData = statusBreakdown.data ?? []
  const pendingData = pendingBySeller.data ?? []
  const settlements = recentSettlements.data?.data ?? []
  const payouts = recentPayouts.data?.data ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Finance Dashboard" description="Settlements, payouts, commissions, and liability tracking" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Commission Revenue" value={formatARS(totalCommission)} trend={{ value: "+8% WoW", direction: "up" }} isLoading={settlementMetrics.isLoading} />
        <KpiCard label="Pending Settlements" value={settlementData ? formatARS(settlementData.pending_cents) : "—"} trend={{ value: "+15%", direction: "up", positive: false }} isLoading={settlementMetrics.isLoading} />
        <KpiCard label="Payout Volume" value={payoutMetrics.data ? formatARS(payoutMetrics.data.total_cents) : "—"} trend={{ value: "+5% WoW", direction: "up" }} isLoading={payoutMetrics.isLoading} />
        <KpiCard label="Settlement Velocity" value={settlementData ? `${settlementData.avg_velocity_days} days` : "—"} trend={{ value: "-0.5d WoW", direction: "down", positive: true }} isLoading={settlementMetrics.isLoading} />
      </div>

      <ChartContainer title="Commission Revenue (Monthly)" isLoading={commission.isLoading} error={commission.error?.message} isEmpty={commissionData.length === 0}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={commissionData}>
            <defs>
              <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `ARS ${(v / 100000).toFixed(0)}`} className="text-muted-foreground" />
            <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatARS(Number(value ?? 0)), "Commission"]} />
            <Area type="monotone" dataKey="value" stroke="var(--color-chart-3)" fill="url(#commGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Recent Settlements"
          isLoading={recentSettlements.isLoading}
          error={recentSettlements.error?.message}
          isEmpty={settlements.length === 0}
          action={<a href="#" className="text-xs text-primary hover:underline">View All &rarr;</a>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="text-sm">{s.seller_name}</TableCell>
                  <TableCell className="text-sm">{formatARS(s.gross_amount_cents)}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartContainer>

        <ChartContainer
          title="Recent Payouts"
          isLoading={recentPayouts.isLoading}
          error={recentPayouts.error?.message}
          isEmpty={payouts.length === 0}
          action={<a href="#" className="text-xs text-primary hover:underline">View All &rarr;</a>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="text-sm">{p.seller_name}</TableCell>
                  <TableCell className="text-sm">{formatARS(p.amount_cents)}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Pending Settlement Liability" isLoading={pendingBySeller.isLoading} error={pendingBySeller.error?.message} isEmpty={pendingData.length === 0}>
          {pendingData.length > 0 && (
            <p className="mb-4 text-2xl font-bold">{formatARS(pendingData.reduce((s, p) => s + p.total_cents, 0))} <span className="text-sm font-normal text-muted-foreground">due to {pendingData.length} sellers</span></p>
          )}
          <div className="space-y-3">
            {pendingData.map((item) => {
              const maxVal = pendingData[0]?.total_cents ?? 1
              const pct = (item.total_cents / maxVal) * 100
              return (
                <div key={item.seller_profile_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.seller_name}</span>
                    <span className="font-medium">{formatARS(item.total_cents)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-4 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartContainer>

        <ChartContainer title="Settlement Status Breakdown" isLoading={statusBreakdown.isLoading} error={statusBreakdown.error?.message} isEmpty={statusData.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="status" label={({ name, value }) => `${name} (${value})`}>
                {statusData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
