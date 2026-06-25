# 4.6 — Analítica de Productos

> **Manager Dashboard — UI Design**
>
> Rendimiento de productos, categorías y salud del catálogo.

---

## Purpose

Ayudar a los gerentes de marketing a entender qué productos y categorías generan ingresos, realizar seguimiento de la salud del catálogo e identificar tendencias.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Analítica de Productos                     [Filtro de fecha ▾]     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Productos│ │ Precio   │ │ Items/   │ │ Categorías│               │
│ │ Activos  │ │ Promedio │ │ Orden    │ │ 8        │               │
│ │ 2,340    │ │ ARS 45K  │ │ 2.3      │ │          │               │
│ │ ↑12%     │ │ ↓2%      │ │ —        │ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Top 10 Productos por Ingresos          Top 10 Productos por Volumen│
│ ┌────────────────────────────────────┐ ┌────────────────────────┐  │
│ │ #  Producto        Ingresos   %    │ │ #  Producto    Unid.   │  │
│ │ ─────────────────────────────────  │ │ ─────────────────────  │  │
│ │ 1  Trek Procaliber ARS 3.1M  12%  │ │ 1  Shimano Set  89    │  │
│ │ 2  Specialized Rock ARS 2.2M  8%  │ │ 2  Trek Proc.   45    │  │
│ │ 3  Shimano XT Set  ARS 1.8M  7%   │ │ 3  Specialized 38    │  │
│ │ 4  Canyon Spectral ARS 1.5M  6%   │ │ 4  Canyon Spec. 32   │  │
│ │ 5  Giant Escape    ARS 1.2M  5%   │ │ 5  Giant Escape  30   │  │
│ │ 6  ...                            │ │ 6  ...               │  │
│ └────────────────────────────────────┘ └────────────────────────┘  │
│                                                                     │
│ Productos por Categoría                Distribución de Ingresos    │
│ ┌────────────────────────────┐         ┌────────────────────────┐  │
│ │ MTB          █████████ 45  │         │ Trek Proc.      ██ 25%│  │
│ │ Partes       █████     20  │         │ Specialized     █ 18% │  │
│ │ Urbana       ████      15  │         │ Shimano Set     █ 15% │  │
│ │ Ruta         ███       12  │         │ Canyon          █ 12% │  │
│ │ Accesorios    █         5  │         │ Giant           █ 10% │  │
│ │ Infanti        ▏        2  │         │ Otros             20% │  │
│ │ BMX            ▏        1  │         └────────────────────────┘  │
│ └────────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- **Component**: `KpiCard` con `trend` (Items/Orden sin trend — hardcoded "2.3")
- **Métricas**: Productos Activos, Precio Promedio, Items/Orden, Categorías
- **Data Source**: Mock (`useProductMetrics`)

### 2. Top 10 Productos por Ingresos
- **Component**: `Table`
- **Columns**: #, Producto (`formatARS()`), Ingresos, Participación %
- **Data Source**: Mock (`useTopProductsByRevenue`)

### 3. Top 10 Productos por Volumen
- **Component**: `Table`
- **Columns**: #, Producto, Unidades Vendidas
- **Data Source**: Mock (`useTopProductsByVolume`)

### 4. Productos por Categoría
- **Component**: Barra horizontal (`BarChart`)
- **Data Source**: Mock (`useProductsByCategory`)

### 5. Distribución de Ingresos por Producto
- **Component**: `DonutChart` (Top 5 + "Otros")
- **Data Source**: Mock (`useTopProductsByRevenue`)

## Estados

### Loading
- Skeleton para tablas de top productos
- Placeholder para gráficos

### Error
- "Datos de productos no disponibles — la app de Seller puede estar caída."
- Mostrar datos derivados de Payments como fallback

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No se vendieron productos en este período.                     │
│                                                                  │
│  El catálogo está vacío. No se encontraron productos activos.   │
└─────────────────────────────────────────────────────────────────┘
```
