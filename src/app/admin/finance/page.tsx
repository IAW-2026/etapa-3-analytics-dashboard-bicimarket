"use client"

import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ExecutiveHealthCard } from "@/components/analytics/executive-health-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { StatusBadge } from "@/components/analytics/status-badge"
import { translateStatus } from "@/lib/labels"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSettlementMetrics, useCommissionTimeSeries, useSettlementStatusBreakdown, usePendingSettlementsBySeller, useRecentSettlements, usePayoutMetrics, useRecentPayments, usePrevSettlementMetrics, usePrevCommissionTimeSeries, usePrevPayoutMetrics } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"
import { formatCompactARS, formatDateLabel } from "@/lib/utils"
import { calculateHealth, percentage } from "@/lib/health-score"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function FinanceDashboardPage() {
  const settlementMetrics = useSettlementMetrics()
  const commission = useCommissionTimeSeries()
  const statusBreakdown = useSettlementStatusBreakdown()
  const pendingBySeller = usePendingSettlementsBySeller()
  const recentSettlements = useRecentSettlements()
  const payoutMetrics = usePayoutMetrics()
  const recentPayments = useRecentPayments()
  const prevSettlementMetrics = usePrevSettlementMetrics()
  const prevCommission = usePrevCommissionTimeSeries()
  const prevPayoutMetrics = usePrevPayoutMetrics()

  const commissionData = commission.data ?? []
  const totalCommission = commissionData.reduce((s, p) => s + p.value, 0)
  const prevCommissionData = prevCommission.data ?? []
  const prevTotalCommission = prevCommissionData.reduce((s, p) => s + p.value, 0)
  const settlementData = settlementMetrics.data
  const statusData = statusBreakdown.data ?? []
  const pendingData = pendingBySeller.data ?? []
  const settlements = recentSettlements.data?.data ?? []
  const payments = recentPayments.data?.data ?? []

  const commissionTrend = computeTrend(prevTotalCommission, totalCommission)
  const pendingLiqTrend = computeTrend(prevSettlementMetrics.data?.pending_cents, settlementMetrics.data?.pending_cents)
  const payoutVolTrend = computeTrend(prevPayoutMetrics.data?.total_cents, payoutMetrics.data?.total_cents)
  const velocityTrend = computeTrend(prevSettlementMetrics.data?.avg_velocity_days, settlementMetrics.data?.avg_velocity_days)
  const settlementCount = settlementData
    ? settlementData.paid_count + settlementData.pending_count + settlementData.failed_count
    : null
  const settlementCompletion = percentage(settlementData?.paid_count, settlementCount)
  const payoutCompletion = percentage(payoutMetrics.data?.completed_count, payoutMetrics.data?.count)
  const financeHealth = calculateHealth([
    { value: settlementCompletion, weight: 70, critical: true },
    { value: payoutCompletion, weight: 30 },
  ])
  const financeNeedsAction = financeHealth && ["urgent", "alert", "attention"].includes(financeHealth.status)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Panel de Finanzas" description="Liquidaciones, pagos, comisiones y seguimiento de pasivos" />

      <ExecutiveHealthCard
        section="Finanzas"
        result={financeHealth}
        sources={["payments"]}
        isLoading={settlementMetrics.isLoading || payoutMetrics.isLoading}
        error={settlementMetrics.error?.message ?? payoutMetrics.error?.message}
        summary={settlementData ? `${settlementData.paid_count.toLocaleString("es-AR")} de ${(settlementCount ?? 0).toLocaleString("es-AR")} liquidaciones están pagadas; ${settlementData.pending_count.toLocaleString("es-AR")} permanecen pendientes.` : "Sin información suficiente para evaluar las finanzas."}
        recommendation={financeNeedsAction ? "Reducir liquidaciones pendientes y revisar inmediatamente pagos fallidos o en revisión manual." : "Mantener el ritmo de liquidación y controlar que el pasivo pendiente no se acelere."}
        metrics={[
          { label: "Liquidaciones pagadas", value: settlementCompletion != null ? `${settlementCompletion.toFixed(1)}%` : "—" },
          { label: "Payouts completados", value: payoutCompletion != null ? `${payoutCompletion.toFixed(1)}%` : "—" },
          { label: "Velocidad promedio", value: settlementData ? `${settlementData.avg_velocity_days} días` : "—" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Comisiones" value={formatARS(totalCommission)} trend={commissionTrend ? { value: commissionTrend.label, direction: commissionTrend.direction } : undefined} isLoading={commission.isLoading} dataSources={["payments"]} />
        <KpiCard label="Liquidaciones Pendientes" value={settlementData ? formatARS(settlementData.pending_cents) : "—"} trend={pendingLiqTrend ? { value: pendingLiqTrend.label, direction: pendingLiqTrend.direction, positive: false } : undefined} isLoading={settlementMetrics.isLoading} dataSources={["payments"]} />
        <KpiCard label="Volumen de Pagos" value={payoutMetrics.data ? formatARS(payoutMetrics.data.total_cents) : "—"} trend={payoutVolTrend ? { value: payoutVolTrend.label, direction: payoutVolTrend.direction } : undefined} isLoading={payoutMetrics.isLoading} dataSources={["payments"]} />
        <KpiCard label="Velocidad de Liquidación" value={settlementData ? `${settlementData.avg_velocity_days} días` : "—"} trend={velocityTrend ? { value: velocityTrend.label, direction: velocityTrend.direction, positive: velocityTrend.direction === "down" } : undefined} isLoading={settlementMetrics.isLoading} dataSources={["payments"]} />
      </div>

      <ChartContainer title="Comisiones (Diario)" isLoading={commission.isLoading} error={commission.error?.message} isEmpty={commissionData.length === 0} dataSources={["payments"]}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={commissionData}>
            <defs>
              <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDateLabel(v)} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactARS(v)} className="text-muted-foreground" />
            <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatARS(Number(value ?? 0)), "Comisión"]} />
            <Area type="monotone" dataKey="value" stroke="var(--color-chart-3)" fill="url(#commGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer
          title="Liquidaciones Recientes"
          isLoading={recentSettlements.isLoading}
          error={recentSettlements.error?.message}
          isEmpty={settlements.length === 0}
          dataSources={["payments"]}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Bruto</TableHead>
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
          title="Pagos Recientes"
          isLoading={recentPayments.isLoading}
          error={recentPayments.error?.message}
          isEmpty={payments.length === 0}
          dataSources={["payments"]}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="text-sm capitalize">{(p.method ?? "—").replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm">{formatARS(p.amount_cents)}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Pasivo de Liquidaciones Pendientes" isLoading={pendingBySeller.isLoading} error={pendingBySeller.error?.message} isEmpty={pendingData.length === 0} dataSources={["payments", "seller"]}>
          {pendingData.length > 0 && (
            <p className="mb-4 text-2xl font-bold">{formatARS(pendingData.reduce((s, p) => s + p.total_cents, 0))} <span className="text-sm font-normal text-muted-foreground">pendientes a {pendingData.length} vendedores</span></p>
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

        <ChartContainer title="Distribución de Estados (Liquidaciones)" isLoading={statusBreakdown.isLoading} error={statusBreakdown.error?.message} isEmpty={statusData.length === 0} dataSources={["payments"]}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} minAngle={10} dataKey="count" nameKey="status" label={({ value }) => `${value}`}>
                {statusData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [value, translateStatus(name as string)]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} formatter={(value: string) => <span className="text-muted-foreground">{translateStatus(value)}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
