# 4.2 — Analítica de Ventas

> **Manager Dashboard — UI Design**
>
> Ingresos, órdenes y rendimiento de ventas.

---

## Purpose

Permitir a los equipos de marketing y ejecutivos explorar los drivers de ingresos: tendencias, rankings de vendedores y análisis por método de pago.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Analítica de Ventas                         [Filtro de fecha ▾]   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Ingresos │ │ Órdenes  │ │ Ticket   │ │ Crecim.  │               │
│ │ ARS 8.2M │ │ 1,245    │ │ Promedio │ │ +12%     │               │
│ │ ↑8%      │ │ ↑5%      │ │ ARS 6.6K │ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Ingresos en el Tiempo                     │ Ingresos por Método    │
│ ┌────────────────────────────────────┐   │ ┌────────────────────┐  │
│ │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇ │   │ │ Tarjeta Créd. 62% │  │
│ │ [Área con gradiente]              │   │ │ Mercado Pago  25% │  │
│ │                                    │   │ │ Débito          8% │  │
│ └────────────────────────────────────┘   │ │ Transferencia   5% │  │
│                                          │ └────────────────────┘  │
│                                          │                         │
│ Ingresos por Vendedor (Top 10)           │ Ingresos por Día        │
│ ┌────────────────────────────────────┐   │ ┌────────────────────┐  │
│ │ #  Vendedor      Ingresos          │   │ │ ▃▅▇▆▅▆▇           │  │
│ │ ─────────────────────────────────  │   │ │ Lun Mar Mié...    │  │
│ │ 1  BiciSur      ARS 3.1M          │   │ └────────────────────┘  │
│ │ 2  BikeAR       ARS 1.8M          │   │                         │
│ │ 3  RodadosXX    ARS 0.9M          │   │                         │
│ │ 4  Ciclos OK    ARS 0.6M          │   │                         │
│ │ 5  MTB House    ARS 0.4M          │   │                         │
│ │ ...                               │   │                         │
│ └────────────────────────────────────┘   │                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- **Component**: `KpiCard` con `trend`
- **Métricas**: Ingresos, Órdenes, Ticket Promedio, Crecimiento
- **Data Source**: `usePaymentMetrics`

### 2. Ingresos en el Tiempo
- **Component**: `AreaChart` de Recharts con relleno gradiente (lg:col-span-2)
- **Data Source**: `useRevenueTrend`
- **Granularidad**: Diario (según filtro de fechas)
- **Interaction**: Tooltip en hover

### 3. Ingresos por Método de Pago
- **Component**: `DonutChart`
- **Data Source**: `useRevenueByMethod`
- **Labels**: `translateMethod()` (Tarjeta de Crédito, Mercado Pago, Débito, Transferencia)

### 4. Ingresos por Vendedor (Top 10)
- **Component**: Lista horizontal con barra de ingresos
- **Data Source**: `useTopSellers`
- **Columns**: #, Vendedor, Ingresos (barra de participación)
- **Interaction**: Click en fila → navega a detalle de vendedor

### 5. Ingresos por Día de la Semana
- **Component**: `BarChart`
- **Data Source**: `useRevenueByDayOfWeek`
- **Labels**: Lun, Mar, Mié, Jue, Vie, Sáb, Dom

## Estados

### Loading
- Skeleton para fila de KPI
- `ChartContainer` con shimmer para cada gráfico

### Error
- `ChartContainer` muestra: "No se pudieron cargar los datos de ventas."
- KPI cards muestran "—" en lugar de valores

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No hay datos de ventas para este período.                      │
│                                                                  │
│  Probá con otro rango de fechas o verificá que haya pagos       │
│  aprobados en el sistema de Payments.                           │
└─────────────────────────────────────────────────────────────────┘
```
