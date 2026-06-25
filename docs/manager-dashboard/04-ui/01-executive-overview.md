# 4.1 — Panel General

> **Manager Dashboard — UI Design**
>
> Resumen general del estado del marketplace.

---

## Purpose

Dar a los ejecutivos una visión general del estado del marketplace en 10 segundos con métricas clave, tendencias y elementos que requieren atención.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  BiciMarket Manager Dashboard                              Admin ▾│
│                                                                     │
│  Panel General                                   [Filtro de fecha] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ GMV      │ │ Órdenes  │ │ Tasa de  │ │ Liquid.  │               │
│ │ ARS 8.2M │ │ 1,245    │ │ Éxito    │ │ Pend.    │               │
│ │ ↑12%     │ │ ↑5%      │ │ 94.2%    │ │ ARS 850K │               │
│ │          │ │          │ │ ↑0.5%    │ │ ⚠️ +15%  │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│  Tendencia de Ingresos                      │  ┌────────────────┐  │
│  ┌─────────────────────────────────────┐   │  │ Resumen        │  │
│  │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█ │   │  │                │  │
│  │ [Área con gradiente]               │   │  │ Ingresos:      │  │
│  │                                     │   │  │ ARS 8.2M       │  │
│  └─────────────────────────────────────┘   │  │ Órdenes: 1,245 │  │
│                                             │  │                │  │
│  Atención Requerida                         │  │ Mejor Vend:    │  │
│  ┌─────────────────────────────────────┐   │  │ BiciSur        │  │
│  │ 🔴 Tasa de éxito 85% < 90%         │   │  └────────────────┘  │
│  │ ⚠️ Pendientes ARS 52M > ARS 50M    │   │  ┌────────────────┐  │
│  │ ⚠️ Reembolsos 7 > 5                │   │  │ Mejores Vend.  │  │
│  │                                     │   │  │ 1. BiciSur     │  │
│  └─────────────────────────────────────┘   │  │ 2. BikeAR      │  │
│                                             │  │ 3. RodadosXX   │  │
│  Ingresos por Día de la Semana             │  │ 4. Ciclos OK   │  │
│  ┌─────────────────────────────────────┐   │  │ 5. MTB House   │  │
│  │ ▃▅▇▆▅▆▇                          │   │  └────────────────┘  │
│  │ Lun Mar Mié Jue Vie Sáb Dom        │   │                    │
│  └─────────────────────────────────────┘   │                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards (Top Row)
- **Component**: `KpiCard` con `trend` opcional (TrendingUp verde, TrendingDown rojo, o nada)
- **Métricas**: GMV, Órdenes, Tasa de Éxito, Liquidaciones Pendientes
- **Data Source**: `usePaymentMetrics` (Payments API via proxy)
- **Refresh**: 60s polling

### 2. Tendencia de Ingresos (Main)
- **Component**: `AreaChart` de Recharts con relleno gradiente
- **Data Source**: `useRevenueTrend`
- **Features**: Tooltip en hover, filtro de fechas vía Zustand

### 3. Resumen (Sidebar)
- **Component**: Card tipo resumen
- **Contenido**: Ingresos totales, resumen de órdenes, nombre del mejor vendedor
- **Data Source**: `usePaymentMetrics` + `useTopSellers`

### 4. Mejores Vendedores
- **Component**: Lista rankeada (Top 5)
- **Data Source**: `useTopSellers`
- **Features**: Click en fila → navega a detalle de vendedor

### 5. Atención Requerida
- **Component**: `AttentionItems` con indicadores de severidad (🔴/⚠️)
- **Data Source**: Computado de umbrales: `tasa_exito < 90%`, `pendientes > ARS 50M`, `reembolsos > 5`
- **Features**: Click para navegar al detalle

### 6. Ingresos por Día de la Semana
- **Component**: `BarChart` (Recharts)
- **Data Source**: `useRevenueByDayOfWeek`
- **Labels**: Lun, Mar, Mié, Jue, Vie, Sáb, Dom

## Estados

### Loading
- Skeleton para los 4 KPI cards
- `ChartContainer` con estado loading para cada gráfico

### Error
- `ChartContainer` muestra mensaje de error y botón reintentar
- KPI cards muestran "—" cuando no hay datos

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No hay datos disponibles para el período seleccionado.          │
│                                                                  │
│  Intentá con otro rango de fechas o verificá la conexión         │
│  con la API de Payments.                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile
- 2 columnas de KPI (en lugar de 4)
- Los gráficos se apilan verticalmente debajo de los KPI
- Atención Requerida como sección colapsable
