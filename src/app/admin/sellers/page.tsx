"use client"

import { useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ExecutiveHealthCard } from "@/components/analytics/executive-health-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { StatusBadge } from "@/components/analytics/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRevenueBySeller, useSettlementMetrics, useSellerMetrics, usePendingSettlementsBySeller, usePrevSettlementMetrics, usePrevSellerMetrics, usePrevRevenueBySeller, useSellers } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"
import { translateStatus } from "@/lib/labels"
import { calculateHealth, inversePercentage, percentage } from "@/lib/health-score"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function SellerAnalyticsPage() {
  const topSellers = useRevenueBySeller()
  const settlementMetrics = useSettlementMetrics()
  const sellerMetrics = useSellerMetrics()
  const pendingSettlements = usePendingSettlementsBySeller()
  const prevSettlementMetrics = usePrevSettlementMetrics()
  const prevSellerMetrics = usePrevSellerMetrics()
  const prevTopSellers = usePrevRevenueBySeller()
  const sellers = useSellers()
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)

  const sellerData = topSellers.data ?? []
  const prevSellerData = prevTopSellers.data ?? []
  const sm = settlementMetrics.data
  const psm = prevSettlementMetrics.data
  const selm = sellerMetrics.data
  const pselm = prevSellerMetrics.data

  const avgRevenue = sellerData.length > 0 ? sellerData.reduce((s, r) => s + r.revenue_cents, 0) / sellerData.length : 0
  const prevAvgRevenue = prevSellerData.length > 0 ? prevSellerData.reduce((s, r) => s + r.revenue_cents, 0) / prevSellerData.length : 0
  const activeSellersTrend = computeTrend(pselm?.verified_count, selm?.verified_count)
  const pendingLiqTrend = computeTrend(psm?.pending_cents, sm?.pending_cents)
  const avgRevenueTrend = computeTrend(prevAvgRevenue, avgRevenue)
  const verificationRate = percentage(selm?.verified_count, selm?.total)
  const goodStandingRate = inversePercentage(selm?.suspended_count, selm?.total)
  const sellerHealth = calculateHealth([
    { value: verificationRate, weight: 70, critical: true },
    { value: goodStandingRate, weight: 30 },
  ])
  const sellersNeedAction = sellerHealth && ["urgent", "alert", "attention"].includes(sellerHealth.status)

  const sellerList = sellers.data?.data ?? []
  const topProductSellers = [...sellerList].sort((a, b) => b.product_count - a.product_count).slice(0, 10)
  const selectedProfile = selectedSeller ? sellerList.find((s) => s.id === selectedSeller) : null
  const selectedRevenue = selectedSeller ? sellerData.find((s) => s.seller_profile_id === selectedSeller)?.revenue_cents : null

  const verificationData = selm
    ? [
        { status: "verified", count: selm.verified_count },
        { status: "pending", count: selm.pending_count },
        { status: "suspended", count: selm.suspended_count },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Analítica de Vendedores" description="Rendimiento, ranking y estado de verificación de vendedores" />

      <ExecutiveHealthCard
        section="Vendedores"
        result={sellerHealth}
        sources={["seller"]}
        isLoading={sellerMetrics.isLoading}
        error={sellerMetrics.error?.message}
        summary={selm ? `${selm.verified_count.toLocaleString("es-AR")} de ${selm.total.toLocaleString("es-AR")} vendedores están verificados y ${selm.suspended_count.toLocaleString("es-AR")} suspendidos.` : "Sin información suficiente para evaluar la red de vendedores."}
        recommendation={sellersNeedAction ? "Acelerar verificaciones pendientes y resolver las causas de suspensión de vendedores." : "Sostener el estándar de verificación y acompañar el crecimiento de los vendedores activos."}
        metrics={[
          { label: "Tasa de verificación", value: verificationRate != null ? `${verificationRate.toFixed(1)}%` : "—" },
          { label: "En buen estado", value: goodStandingRate != null ? `${goodStandingRate.toFixed(1)}%` : "—" },
          { label: "Productos publicados", value: selm?.product_count_total.toLocaleString("es-AR") ?? "—" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vendedores Activos" value={selm ? String(selm.verified_count) : "—"} trend={activeSellersTrend ? { value: activeSellersTrend.label, direction: activeSellersTrend.direction } : undefined} isLoading={sellerMetrics.isLoading} dataSources={["seller"]} />
        <KpiCard label="Liquidaciones Pendientes" value={sm ? formatARS(sm.pending_cents) : "—"} trend={pendingLiqTrend ? { value: pendingLiqTrend.label, direction: pendingLiqTrend.direction, positive: false } : undefined} isLoading={settlementMetrics.isLoading} dataSources={["payments"]} />
        <KpiCard label="Ingreso Promedio" value={formatARS(avgRevenue)} trend={avgRevenueTrend ? { value: avgRevenueTrend.label, direction: avgRevenueTrend.direction } : undefined} isLoading={topSellers.isLoading} dataSources={["payments", "seller"]} />
        <KpiCard label="Mejor Vendedor" value={sellerData[0]?.seller_name ?? "—"} isLoading={topSellers.isLoading} dataSources={["payments", "seller"]} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Ranking de Vendedores (por Ingresos)" isLoading={topSellers.isLoading} error={topSellers.error?.message} isEmpty={sellerData.length === 0} dataSources={["payments", "seller"]}>
          <div className="max-h-[650px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 z-10 w-8 bg-card">#</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card">Vendedor</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card">Ingresos</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-card text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerData.map((seller, idx) => (
                  <TableRow key={seller.seller_profile_id} className="cursor-pointer" onClick={() => setSelectedSeller(seller.seller_profile_id)}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{seller.seller_name}</TableCell>
                    <TableCell className="text-sm">{formatARS(seller.revenue_cents)}</TableCell>
                    <TableCell className="text-right text-xs text-primary">Ver</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartContainer>

        <div className="grid gap-6">
          <ChartContainer title="Estado de Verificación" isLoading={sellerMetrics.isLoading} error={sellerMetrics.error?.message} isEmpty={verificationData.length === 0} dataSources={["seller"]}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={verificationData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="count" nameKey="status" label={({ name, value }) => `${translateStatus(name)}: ${value}`}>
                  {verificationData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Top 10 Productos por Vendedor" isLoading={sellers.isLoading} isEmpty={topProductSellers.length === 0} dataSources={["seller"]}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductSellers.map((s) => ({ name: s.display_name, count: s.product_count }))} margin={{ top: 12, right: 8, left: -16, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" className="text-muted-foreground" height={60} interval={0} />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                <Bar dataKey="count" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <ChartContainer title="Liquidaciones Pendientes por Vendedor" isLoading={pendingSettlements.isLoading} error={pendingSettlements.error?.message} isEmpty={(pendingSettlements.data?.length ?? 0) === 0} dataSources={["payments", "seller"]}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Monto Pendiente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(pendingSettlements.data ?? []).map((s) => (
              <TableRow key={s.seller_profile_id}>
                <TableCell className="text-sm font-medium">{s.seller_name}</TableCell>
                <TableCell className="text-right text-sm">{formatARS(s.total_cents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ChartContainer>

      <Sheet open={!!selectedSeller} onOpenChange={(open) => { if (!open) setSelectedSeller(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="pb-0">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {selectedProfile?.display_name?.slice(0, 2).toUpperCase() ?? "??"}
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-xl leading-tight">{selectedProfile?.display_name ?? "Detalle del Vendedor"}</SheetTitle>
                {selectedProfile && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{selectedProfile.legal_name}</p>
                )}
                {selectedProfile && (
                  <div className="mt-2">
                    <StatusBadge status={selectedProfile.verification_status} />
                  </div>
                )}
              </div>
            </div>
          </SheetHeader>

          {selectedProfile && (
            <div className="mt-6 space-y-6 px-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Productos activos</p>
                  <p className="mt-1 text-2xl font-bold">{selectedProfile.product_count}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Ingresos del período</p>
                  <p className="mt-1 text-2xl font-bold">{selectedRevenue != null ? formatARS(selectedRevenue) : "—"}</p>
                </div>
                <div className="col-span-2 rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Miembro desde</p>
                  <p className="mt-1 text-base font-medium">
                    {new Date(selectedProfile.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datos Fiscales</p>
                <div className="divide-y rounded-lg border">
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground">CUIT / CUIL</p>
                    <p className="mt-0.5 font-mono text-sm font-medium">{selectedProfile.tax_id}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground">Condición fiscal</p>
                    <p className="mt-0.5 text-sm capitalize">{selectedProfile.tax_condition.replace(/_/g, " ")}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground">CBU / Alias bancario</p>
                    <p className="mt-0.5 break-all font-mono text-xs">{selectedProfile.bank_account_reference}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
