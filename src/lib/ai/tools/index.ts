import { dynamicTool } from "ai"
import { z } from "zod"
import { getServiceJson } from "@/lib/service-auth"

function toParams(from?: string, to?: string): string {
  const p = new URLSearchParams()
  if (from) p.set("from", from)
  if (to) p.set("to", to)
  const qs = p.toString()
  return qs ? `?${qs}` : ""
}

export const dashboardTools = {
  queryPayments: dynamicTool({
    description:
      "Obtener métricas de pagos (totales, aprobados, ticket promedio) o listado paginado de transacciones. " +
      "Sin page/limit devuelve métricas agregadas; con page/limit devuelve transacciones individuales.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
      page: z.number().int().positive().optional().describe("Número de página"),
      limit: z.number().int().positive().max(100).optional().describe("Items por página"),
    }),
    execute: async (args: unknown) => {
      const { page, limit, from, to } = args as { from?: string; to?: string; page?: number; limit?: number }
      if (page !== undefined || limit !== undefined) {
        return getServiceJson("payments", `/api/v1/payments${toParams(from, to)}&page=${page ?? 1}&limit=${limit ?? 20}`)
      }
      return getServiceJson("payments", `/api/v1/payments/metrics${toParams(from, to)}`)
    },
  }),

  querySettlements: dynamicTool({
    description:
      "Obtener métricas de liquidaciones (pendientes, pagadas, velocidad promedio) " +
      "o listado paginado de liquidaciones. Incluye filtro por estado (pending/paid/failed).",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
      status: z.string().optional().describe("Filtrar por estado: pending, paid, failed"),
      page: z.number().int().positive().optional().describe("Número de página"),
      limit: z.number().int().positive().max(100).optional().describe("Items por página"),
    }),
    execute: async (args: unknown) => {
      const { page, limit, status, from, to } = args as { from?: string; to?: string; status?: string; page?: number; limit?: number }
      if (page !== undefined || limit !== undefined) {
        const p = new URLSearchParams()
        if (from) p.set("from", from)
        if (to) p.set("to", to)
        if (status) p.set("status", status)
        p.set("page", String(page ?? 1))
        p.set("limit", String(limit ?? 20))
        return getServiceJson("payments", `/api/v1/settlements?${p.toString()}`)
      }
      return getServiceJson("payments", `/api/v1/settlements/metrics${toParams(from, to)}`)
    },
  }),

  queryRefunds: dynamicTool({
    description: "Obtener métricas de reembolsos: total, aprobados, montos y desglose por motivo.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from?: string; to?: string }
      return getServiceJson("payments", `/api/v1/refunds/metrics${toParams(from, to)}`)
    },
  }),

  getRevenueInsights: dynamicTool({
    description:
      "Obtener serie temporal de ingresos para analizar tendencias, " +
      "comparar períodos o detectar picos y valles.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from?: string; to?: string }
      return getServiceJson("payments", `/api/v1/payments/revenue/timeseries${toParams(from, to)}`)
    },
  }),

  getCommissionTimeSeries: dynamicTool({
    description: "Obtener evolución de comisiones en el tiempo. Útil para analizar costos por plataforma.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from?: string; to?: string }
      return getServiceJson("payments", `/api/v1/settlements/commission/timeseries${toParams(from, to)}`)
    },
  }),

  getPendingSettlementsBySeller: dynamicTool({
    description:
      "Obtener lista de vendedores con liquidaciones pendientes, incluyendo montos adeudados " +
      "y cantidad de órdenes sin liquidar. Ideal para priorizar pagos a vendedores.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from?: string; to?: string }
      return getServiceJson("payments", `/api/v1/settlements/pending-by-seller${toParams(from, to)}`)
    },
  }),

  querySalesOrders: dynamicTool({
    description:
      "Obtener métricas de órdenes de venta: totales, pendientes, aceptadas, entregadas, " +
      "tasa de aceptación y órdenes pendientes agrupadas por vendedor.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from?: string; to?: string }
      return getServiceJson("seller", `/api/v1/sales-orders/metrics${toParams(from, to)}`)
    },
  }),

  queryProducts: dynamicTool({
    description: "Obtener métricas de productos: total, por categoría, por condición, precio promedio.",
    inputSchema: z.object({}),
    execute: async () => {
      return getServiceJson("seller", "/api/v1/products/metrics")
    },
  }),

  querySellers: dynamicTool({
    description:
      "Obtener métricas de vendedores: total, verificados, pendientes, suspendidos, " +
      "cantidad total de productos. Para listado detallado no usar tool, consultar en la UI.",
    inputSchema: z.object({}),
    execute: async () => {
      return getServiceJson("seller", "/api/v1/sellers/metrics")
    },
  }),

  queryBuyers: dynamicTool({
    description:
      "Obtener métricas de compradores: total, nuevos en el período, tasa de recompra, " +
      "compradores en riesgo. Útil para analizar retención y salud de la base de clientes.",
    inputSchema: z.object({
      from: z.string().optional().describe("Fecha inicio (ISO string)"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from?: string; to?: string }
      return getServiceJson("buyer", `/api/v1/admin/buyers/metrics${toParams(from, to)}`)
    },
  }),

  forecastRevenue: dynamicTool({
    description:
      "Obtener datos históricos de ingresos para proyectar ingresos futuros. " +
      "Devuelve la serie temporal de ingresos que el asistente usa para identificar tendencias " +
      "y generar un pronóstico. Útil para responder preguntas como '¿cómo serán los ingresos el próximo mes?'",
    inputSchema: z.object({
      from: z.string().describe("Fecha inicio (ISO string) — al menos 3 meses atrás para pronóstico confiable"),
      to: z.string().optional().describe("Fecha fin (ISO string)"),
    }),
    execute: async (args: unknown) => {
      const { from, to } = args as { from: string; to?: string }
      return getServiceJson("payments", `/api/v1/payments/revenue/timeseries${toParams(from, to)}`)
    },
  }),

  generateChartData: dynamicTool({
    description:
      "Formatear datos estructurados para generar una visualización inline. " +
      "Recibe datos y tipo de gráfico y los devuelve en formato estandarizado para renderizado.",
    inputSchema: z.object({
      chartType: z.enum(["line", "bar", "pie"]).describe("Tipo de gráfico"),
      title: z.string().describe("Título del gráfico"),
      labels: z.array(z.string()).describe("Etiquetas para el eje X o categorías"),
      values: z.array(z.number()).describe("Valores numéricos"),
      series: z
        .array(z.object({ name: z.string(), data: z.array(z.number()) }))
        .optional()
        .describe("Series adicionales para gráficos multi-línea"),
    }),
    execute: async (args: unknown) => {
      const data = args as {
        chartType: "line" | "bar" | "pie"
        title: string
        labels: string[]
        values: number[]
        series?: { name: string; data: number[] }[]
      }
      return {
        type: "chart" as const,
        ...data,
        generatedAt: new Date().toISOString(),
      }
    },
  }),
}

export type DashboardToolName = keyof typeof dashboardTools