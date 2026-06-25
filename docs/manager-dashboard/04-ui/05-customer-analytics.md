# 4.5 — Analítica de Clientes

> **Manager Dashboard — UI Design**
>
> Adquisición, comportamiento y segmentación de clientes.

---

## Purpose

Proporcionar información sobre compradores: cantidad, tendencias de adquisición, tasa de recompra y segmentación. Requiere un endpoint admin del Buyer App (pendiente).

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Analítica de Clientes                      [Filtro de fecha ▾]     │
├─────────────────────────────────────────────────────────────────────┤
│ ⚠️ Disponibilidad Limitada de Datos — requiere endpoint del       │
│               Buyer App para habilitar todas las métricas          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Total    │ │ Nuevos   │ │ Tasa de  │ │ Comprad. │               │
│ │ Comprad. │ │ Comprad. │ │ Recompra │ │ en Riesgo│               │
│ │ —        │ │ —        │ │ —        │ │ —        │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Datos no disponibles —                          Uso de Métodos     │
│ requiere endpoint del Buyer App                de Pago             │
│ ┌────────────────────────────────────┐         ┌────────────────┐  │
│ │                                    │         │ T. Créd  62%   │  │
│ │     [Placeholder — sin datos]      │         │ MPago    25%   │  │
│ │                                    │         │ Débito    8%   │  │
│ └────────────────────────────────────┘         │ Transfer   5%  │  │
│                                                └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- **Component**: `KpiCard` (todos muestran "—")
- **Métricas**: Total Compradores, Nuevos Compradores, Tasa de Recompra, Compradores en Riesgo
- **Data Source**: No disponible — muestra "—"
- **Nota**: Requiere `GET /api/v1/admin/buyers` y `GET /api/v1/admin/buyers/metrics`

### 2. Contenido Principal
- **Component**: Placeholder con texto "Datos no disponibles — requiere endpoint del Buyer App"
- **Data Source**: No disponible

### 3. Uso de Métodos de Pago
- **Component**: `DonutChart` (único gráfico funcional)
- **Data Source**: `useRevenueByMethod` (Payments API)
- **Labels**: `translateMethod()` (Tarjeta de Crédito, Mercado Pago, Débito, Transferencia)

## Estados

### Loading
- Skeleton para KPI cards
- Placeholder para gráfico principal

### Error
- "Datos de clientes no disponibles — el Buyer App no tiene el endpoint admin requerido."
- El DonutChart de métodos de pago se muestra igualmente

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No hay datos de compradores disponibles para este período.      │
│                                                                  │
│  Esta vista requiere un endpoint admin del Buyer App            │
│  (GET /api/v1/admin/buyers, GET /api/v1/admin/buyers/metrics).  │
│  Sin él, solo se muestran los métodos de pago de la API de      │
│  Payments.                                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Nota de Data Source

Esta pantalla depende del endpoint admin del Buyer App. Sin él, todos los widgets excepto "Uso de Métodos de Pago" (Payments API) muestran "Datos no disponibles — requiere endpoint del Buyer App".
