"use client"

import { useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { StatusBadge } from "@/components/analytics/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRevenueBySeller, useSettlementMetrics, useSellerMetrics, usePrevSettlementMetrics, usePrevSellerMetrics, usePrevRevenueBySeller } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"
import { mockData } from "@/lib/mock/mock-data"
import { translateStatus } from "@/lib/labels"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function SellerAnalyticsPage() {
  const topSellers = useRevenueBySeller()
  const settlementMetrics = useSettlementMetrics()
  const sellerMetrics = useSellerMetrics()
  const prevSettlementMetrics = usePrevSettlementMetrics()
  const prevSellerMetrics = usePrevSellerMetrics()
  const prevTopSellers = usePrevRevenueBySeller()
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

  const selectedProfile = selectedSeller ? mockData.sellers.find((s) => s.id === selectedSeller) : null
  const selectedSettlements = selectedSeller
    ? mockData.settlements.filter((s) => s.seller_profile_id === selectedSeller)
    : []

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vendedores Activos" value={selm ? String(selm.verified_count) : "—"} trend={activeSellersTrend ? { value: activeSellersTrend.label, direction: activeSellersTrend.direction } : undefined} isLoading={sellerMetrics.isLoading} />
        <KpiCard label="Liquidaciones Pendientes" value={sm ? formatARS(sm.pending_cents) : "—"} trend={pendingLiqTrend ? { value: pendingLiqTrend.label, direction: pendingLiqTrend.direction, positive: false } : undefined} isLoading={settlementMetrics.isLoading} />
        <KpiCard label="Ingreso Promedio" value={formatARS(avgRevenue)} trend={avgRevenueTrend ? { value: avgRevenueTrend.label, direction: avgRevenueTrend.direction } : undefined} isLoading={topSellers.isLoading} />
        <KpiCard label="Mejor Vendedor" value={sellerData[0]?.seller_name ?? "—"} isLoading={topSellers.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Ranking de Vendedores (por Ingresos)" isLoading={topSellers.isLoading} error={topSellers.error?.message} isEmpty={sellerData.length === 0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
        </ChartContainer>

        <div className="grid gap-6">
          <ChartContainer title="Estado de Verificación" isLoading={sellerMetrics.isLoading} error={sellerMetrics.error?.message} isEmpty={verificationData.length === 0}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={verificationData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="count" nameKey="status" label={({ name, value }) => `${translateStatus(name)}: ${value}`}>
                  {verificationData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Productos por Vendedor" isLoading={sellerMetrics.isLoading} isEmpty={mockData.sellers.length === 0}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockData.sellers.map((s) => ({ name: s.display_name, count: s.product_count }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="text-muted-foreground" width={90} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                <Bar dataKey="count" fill="var(--color-chart-4)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <ChartContainer title="Liquidaciones por Vendedor" isLoading={false} isEmpty={mockData.settlements.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead>Pagado</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.sellers.map((seller) => {
              const sellerSettlements = mockData.settlements.filter((s) => s.seller_profile_id === seller.id)
              const pending = sellerSettlements.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.net_amount_cents, 0)
              const paid = sellerSettlements.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.net_amount_cents, 0)
              const total = pending + paid
              if (total === 0) return null
              return (
                <TableRow key={seller.id}>
                  <TableCell className="text-sm font-medium">{seller.display_name}</TableCell>
                  <TableCell className="text-sm">{pending > 0 ? formatARS(pending) : "—"}</TableCell>
                  <TableCell className="text-sm">{paid > 0 ? formatARS(paid) : "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{formatARS(total)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </ChartContainer>

      <Sheet open={!!selectedSeller} onOpenChange={(open) => { if (!open) setSelectedSeller(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedProfile?.display_name ?? "Detalle del Vendedor"}</SheetTitle>
          </SheetHeader>
          {selectedProfile && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado</span>
                  <StatusBadge status={selectedProfile.verification_status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productos</span>
                  <span>{selectedProfile.product_count} activos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desde</span>
                  <span>{new Date(selectedProfile.created_at).toLocaleDateString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Respuesta Promedio</span>
                  <span>{selectedProfile.avg_response_time_hours}h</span>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Liquidaciones Recientes</h4>
                <div className="space-y-2">
                  {selectedSettlements.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span className="font-mono text-xs">{s.id}</span>
                      <StatusBadge status={s.status} />
                      <span>{formatARS(s.net_amount_cents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
