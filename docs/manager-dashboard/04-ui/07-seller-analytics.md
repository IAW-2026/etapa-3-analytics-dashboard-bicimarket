# 4.7 — Analítica de Vendedores

> **Manager Dashboard — UI Design**
>
> Rendimiento, ranking y estado de verificación de vendedores.

---

## Purpose

Permitir a los gerentes del marketplace monitorear la salud de los vendedores, identificar los mejores performers y detectar vendedores que necesitan atención.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Analítica de Vendedores                    [Filtro de fecha ▾]     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Vended.  │ │ Liquid.  │ │ Ingreso  │ │ Mejor    │               │
│ │ Activos  │ │ Pend.    │ │ Promedio │ │ Vendedor │               │
│ │ 24       │ │ ARS 850K │ │ ARS 342K │ │ BiciSur  │               │
│ │ —        │ │ 12 vend. │ │ ↑5%      │ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Ranking de Vendedores                      │ Estado de Verificación│
│ ┌─────────────────────────────────────┐   │ ┌───────────────────┐ │
│ │ #  Vendedor    Ingresos    Acciones │   │ │ Verificado   20   │ │
│ │ ─────────────────────────────────── │   │ │ Pendiente     2   │ │
│ │ 1  BiciSur    ARS 3.1M       [Ver] │   │ │ Suspendido    1   │ │
│ │ 2  BikeAR     ARS 1.8M       [Ver] │   │ └───────────────────┘ │
│ │ 3  RodadosXX  ARS 0.9M       [Ver] │   │                       │
│ │ 4  Ciclos OK  ARS 0.6M       [Ver] │   │ Productos por Vend.   │
│ │ 5  MTB House  ARS 0.4M       [Ver] │   │ ┌───────────────────┐ │
│ │ ...                               │   │ │ BiciSur    ████ 245│ │
│ │                                   │   │ │ MTB House  ████ 234│ │
│ └─────────────────────────────────────┘   │ │ BikeAR     ███  189│ │
│                                            │ │ RodadosXX  ███  156│ │
│                                            │ │ Ciclos OK  █    78│ │
│                                            │ └───────────────────┘ │
│ Liquidaciones por Vendedor                                         │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Vendedor     Pendiente    Pagado        Total                │   │
│ │ ──────────────────────────────────────────────────────────── │   │
│ │ BiciSur      ARS 120K     ARS 3.0M    ARS 3.12M             │   │
│ │ BikeAR       ARS 80K      ARS 1.7M    ARS 1.78M             │   │
│ │ RodadosXX    ARS 45K      ARS 850K    ARS 895K              │   │
│ │ ...                                                          │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Sheet (al hacer clic en "Ver"):
┌─────────────────────────────────────────────┐
│  BiciSur                                     │
│  ─────────────────────────────────────────── │
│  Estado:    Verificado  (StatusBadge)        │
│  Productos: 245 activos                      │
│  Desde:     Ene 2025                         │
│  Respuesta: 2.4 h promedio                   │
│                                              │
│  Liquidaciones Recientes                     │
│  ┌────────────────────────────────────────┐  │
│  │ ID      Monto    Fecha      Status     │  │
│  │ LIQ-10 ARS 45K  10/06    Pagado       │  │
│  │ LIQ-9  ARS 38K  08/06    Pagado       │  │
│  │ LIQ-8  ARS 52K  05/06    Pendiente    │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- **Component**: `KpiCard` — Vendedores Activos (sin trend), Liquidaciones Pendientes (con trend), Ingreso Promedio (con trend), Mejor Vendedor (sin trend — muestra nombre)
- **Data Source**: `useSellerMetrics` (mock)

### 2. Ranking de Vendedores
- **Component**: `Table` con #, Vendedor, Ingresos, Acciones (botón "Ver")
- **Data Source**: `useSellerRankings` (mock)
- **Interaction**: Click en "Ver" → abre `Sheet` con detalle del vendedor

### 3. Estado de Verificación
- **Component**: `DonutChart`
- **Data Source**: `useSellerVerificationStatus` (mock)
- **Labels**: Verificado, Pendiente, Suspendido

### 4. Productos por Vendedor
- **Component**: `BarChart` horizontal
- **Data Source**: `useProductsBySeller` (mock)

### 5. Liquidaciones por Vendedor
- **Component**: `Table` full-width
- **Columns**: Vendedor, Pendiente, Pagado, Total (todos en `formatARS()`)
- **Data Source**: `useSellerSettlements` (mock)

### 6. Sheet de Detalle del Vendedor
- **Component**: `Sheet` (shadcn) con:
  - Estado (`StatusBadge` con `translateStatus()`)
  - Productos: cantidad
  - Desde: fecha de registro
  - Respuesta Promedio: en horas
  - Liquidaciones Recientes: tabla con ID, Monto, Fecha, Status

## Estados

### Loading
- Skeleton para filas de tabla
- Placeholder para DonutChart y BarChart

### Error
- "Datos de vendedores no disponibles — la app de Seller puede estar caída."
- Mostrar datos derivados de liquidaciones como fallback

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No se encontraron vendedores activos para este período.        │
│                                                                  │
│  No hay datos de vendedores disponibles.                         │
└─────────────────────────────────────────────────────────────────┘
```
