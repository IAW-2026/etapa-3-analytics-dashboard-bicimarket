# 4.4 — Panel de Finanzas

> **Manager Dashboard — UI Design**
>
> Liquidaciones, pagos, comisiones y seguimiento de pasivos.

---

## Purpose

Dar al gerente de finanzas una visión integral de las finanzas del marketplace: comisiones ganadas, pasivos pendientes, rendimiento de pagos y conciliación.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Panel de Finanzas                           [Filtro de fecha ▾]   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Comis.   │ │ Liquid.  │ │ Volumen  │ │ Velocidad│               │
│ │ ARS 820K │ │ Pend.    │ │ de Pagos │ │ de Liquid│               │
│ │ ↑8%      │ │ ARS 850K │ │ ARS 7.4M │ │ 4.2 días │               │
│ │          │ │ ⚠️ +15%  │ │ ↑5%      │ │ ↓0.5     │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Comisiones (Diario)                                                │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                           │   │
│ │ [Área con gradiente]                                         │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌────────────────────────────┐    ┌────────────────────────────┐   │
│ │ Liquidaciones Recientes    │    │ Pagos Recientes            │   │
│ │ ────────────────────────── │    │ ────────────────────────── │   │
│ │ ID  Vendedor  Bruto Status│    │ ID  Método  Monto   Status │   │
│ │ LIQ-1 BiciSur ARS  Pagado │    │ PAG-1 T. Créd  ARS    ✓   │   │
│ │ LIQ-2 BikeAR  ARS  Pend.  │    │ PAG-2 MPago   ARS    ✓   │   │
│ │ LIQ-3 Rodados ARS  Pagado │    │ PAG-3 Débito  ARS    ✗   │   │
│ │ LIQ-4 Ciclos  ARS  Pend.  │    │ PAG-4 T. Créd  ARS    ✓   │   │
│ │ ...                       │    │ ...                       │   │
│ └────────────────────────────┘    └────────────────────────────┘   │
│                                                                     │
│ Pasivo de Liquidaciones Pendientes   Distribución de Estados       │
│ ┌────────────────────────────────┐  ┌──────────────────────────┐   │
│ │ ARS 850K — 12 vendedores       │  │ Pagado        75% ███████│   │
│ │                                │  │ Pendiente     20% ████   │   │
│ │ [Barra por vendedor]           │  │ Revisión Manual 3% ▏     │   │
│ │                                │  │ Fallido         2% ▏     │   │
│ └────────────────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- **Component**: `KpiCard` con `trend`
- **Métricas**: Comisiones, Liquidaciones Pendientes, Volumen de Pagos, Velocidad de Liquidación
- **Data Source**: `useSettlementMetrics`, `usePaymentMetrics`

### 2. Comisiones (Diario)
- **Component**: `AreaChart` con relleno gradiente (full-width)
- **Data Source**: `useCommissionTrend`
- **Granularidad**: Diario

### 3. Liquidaciones Recientes
- **Component**: `Table`
- **Columns**: ID, Vendedor, Bruto, Status (`StatusBadge` con `translateStatus()`)
- **Data Source**: `useRecentSettlements`
- **Nota**: Sin enlaces "Ver Todo"

### 4. Pagos Recientes
- **Component**: `Table`
- **Columns**: ID, Método (`translateMethod()`), Monto (`formatARS()`), Status (`StatusBadge`)
- **Data Source**: `useRecentPayments`
- **Nota**: Sin enlaces "Ver Todo"

### 5. Pasivo de Liquidaciones Pendientes
- **Component**: Total + barra horizontal por vendedor
- **Data Source**: `usePendingSettlements`

### 6. Distribución de Estados (Liquidaciones)
- **Component**: `DonutChart`
- **Data Source**: `useSettlementStatusDistribution`
- **Labels**: `translateStatus()` (Pagado, Pendiente, Revisión Manual, Fallido)

## Estados

### Loading
- Skeleton para tablas de liquidaciones y pagos
- `ChartContainer` placeholder para gráficos

### Error
- "Datos financieros no disponibles — la app de Payments puede estar caída."
- Mostrar últimos valores conocidos con badge "dato desactualizado"

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No se encontraron liquidaciones para este período.              │
│                                                                  │
│  No hay liquidaciones pendientes. Todos los vendedores          │
│  han sido pagados.                                               │
└─────────────────────────────────────────────────────────────────┘
```
