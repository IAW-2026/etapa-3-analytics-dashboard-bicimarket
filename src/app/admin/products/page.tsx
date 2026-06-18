"use client"

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProductMetrics, useTopProductsByRevenue, usePrevProductMetrics } from "@/hooks/use-dashboard-data"
import { computeTrend } from "@/lib/trends"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-5)", "var(--color-chart-4)", "var(--color-chart-3)"]

function formatARS(cents: number | undefined | null) {
  if (cents == null || Number.isNaN(cents)) return "—"
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function ProductAnalyticsPage() {
  const productMetrics = useProductMetrics()
  const topProducts = useTopProductsByRevenue()
  const prevProductMetrics = usePrevProductMetrics()

  const pm = productMetrics.data
  const ppm = prevProductMetrics.data
  const topRev = topProducts.data?.slice(0, 10) ?? []

  const activeProductsTrend = computeTrend(ppm?.total, pm?.total)
  const avgPriceTrend = computeTrend(ppm?.avg_price_cents, pm?.avg_price_cents)
  const categoriesTrend = computeTrend(ppm?.categories_count, pm?.categories_count)
  const topVol = topProducts.data ? [...topProducts.data].sort((a, b) => b.units - a.units).slice(0, 10) : []

  const byCategory = pm?.by_category ?? []
  const categoryRevenueData = byCategory.map((c) => ({ ...c, label: c.category.charAt(0).toUpperCase() + c.category.slice(1) }))
  const pieData = topRev.length > 5
    ? [
        ...topRev.slice(0, 5).map((p) => ({ name: p.name, value: p.revenue })),
        { name: "Otros", value: topRev.slice(5).reduce((s, p) => s + p.revenue, 0) },
      ]
    : topRev.map((p) => ({ name: p.name, value: p.revenue }))

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Analítica de Productos" description="Rendimiento de productos, categorías y salud del catálogo" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Productos Activos" value={pm?.total != null ? pm.total.toLocaleString("es-AR") : "—"} trend={activeProductsTrend ? { value: activeProductsTrend.label, direction: activeProductsTrend.direction } : undefined} isLoading={productMetrics.isLoading} />
        <KpiCard label="Precio Promedio" value={pm ? formatARS(pm.avg_price_cents) : "—"} trend={avgPriceTrend ? { value: avgPriceTrend.label, direction: avgPriceTrend.direction } : undefined} isLoading={productMetrics.isLoading} />
        <KpiCard label="Items/Orden" value="2.3" isLoading={productMetrics.isLoading} />
        <KpiCard label="Categorías" value={pm ? String(pm.categories_count) : "—"} trend={categoriesTrend ? { value: categoriesTrend.label, direction: categoriesTrend.direction } : undefined} isLoading={productMetrics.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Top 10 Productos por Ingresos" isLoading={topProducts.isLoading} error={topProducts.error?.message} isEmpty={topRev.length === 0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Participación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRev.map((prod, idx) => {
                const total = topRev.reduce((s, p) => s + p.revenue, 0)
                const share = total > 0 ? (prod.revenue / total) * 100 : 0
                return (
                  <TableRow key={prod.product_id}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm font-medium">{prod.name}</TableCell>
                    <TableCell className="text-sm">{formatARS(prod.revenue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-chart-1" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{share.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ChartContainer>

        <ChartContainer title="Top 10 Productos por Volumen" isLoading={topProducts.isLoading} error={topProducts.error?.message} isEmpty={topVol.length === 0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Unidades Vendidas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVol.map((prod, idx) => (
                <TableRow key={prod.product_id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm font-medium">{prod.name}</TableCell>
                  <TableCell className="text-sm">{prod.units}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Productos por Categoría" isLoading={productMetrics.isLoading} error={productMetrics.error?.message} isEmpty={categoryRevenueData.length === 0}>
          <div className="space-y-3">
            {categoryRevenueData.slice(0, 8).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{cat.label}</span>
                  <span className="text-muted-foreground">{cat.count} productos</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-2 transition-all" style={{ width: `${(cat.count / (pm?.total ?? 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer title="Distribución de Ingresos por Producto" isLoading={topProducts.isLoading} error={topProducts.error?.message} isEmpty={pieData.length === 0}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                formatter={(value) => [formatARS(Number(value ?? 0)), "Ingresos"]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                formatter={(value: string) => (
                  <span className="text-muted-foreground">{value.length > 25 ? `${value.slice(0, 25)}…` : value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
