# 4.3 — Panel de Operaciones

> **Manager Dashboard — UI Design**
>
> Pipeline de cumplimiento, cuellos de botella y rendimiento de entregas.

---

## Purpose

Dar a los gerentes de operaciones visibilidad en tiempo real del pipeline de cumplimiento de órdenes, desde el pago hasta la entrega, con identificación de cuellos de botella.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Panel de Operaciones                       [Filtro de fecha ▾]     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Tasa de  │ │ Tiempo   │ │ Envíos   │ │ Tasa de  │               │
│ │ Cumplim. │ │ Prom.    │ │ Pend.    │ │ Aceptac. │               │
│ │ 87%      │ │ Entrega  │ │ 25       │ │ 92%      │               │
│ │ ↑2%      │ │ 3.2 días │ │ ↑5%      │ │ ↓3%      │               │
│ │          │ │ ↓0.3     │ │          │ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Embudo de Cumplimiento                    Pendientes por Estado     │
│ ┌────────────────────────────────────┐   ┌──────────────────────┐  │
│ │ Pagado                             │   │ Listo para Recoger 12│  │
│ │ ██████████████████████████████ 1245│   │ Recogido            8│  │
│ │ ↓                                   │   │ En Tránsito        25│  │
│ │ Aceptado                            │   └──────────────────────┘  │
│ │ ████████████████████████████   1145│                             │
│ │ ↓                                   │                             │
│ │ Enviado                             │                             │
│ │ ███████████████████████████    1090│                             │
│ │ ↓                                   │                             │
│ │ Entregado                           │                             │
│ │ ██████████████████████████    1080│                             │
│ │                                     │                             │
│ │ Pérdida: Pagado→Aceptado: -8%      │                             │
│ │          Aceptado→Enviado: -5%     │                             │
│ └────────────────────────────────────┘                             │
│                                                                     │
│ Aceptación Pendiente de Vendedores      Entregas Recientes         │
│ ┌────────────────────────────────────┐  ┌────────────────────────┐ │
│ │ Vendedor   Pend.  Espera          │  │ Entregados        ██   │ │
│ │ ───────────────────────────────── │  │ En Tránsito        ░░  │ │
│ │ BikeAR     5     9 días  🔴      │  │ Fallidos           ░░  │ │
│ │ RodadosXX  4     4 días  🟡      │  │                        │ │
│ │ MTB House  3     1 día   🟢      │  │ Tasa de Cumplimiento   │ │
│ │ Ciclos OK  2     1 día   🟢      │  │ 94.2%                  │ │
│ │ BiciSur    1     0 días  🟢      │  └────────────────────────┘ │
│ └────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- **Component**: `KpiCard` con `trend`
- **Métricas**: Tasa de Cumplimiento, Tiempo Prom. de Entrega, Envíos Pendientes, Tasa de Aceptación
- **Data Source**: `useShipmentMetrics`, `useSalesOrderMetrics` (mock)

### 2. Embudo de Cumplimiento
- **Component**: Barras horizontales personalizadas con conectores
- **Etapas**: Pagado → Aceptado → Enviado → Entregado
- **Data Source**: `useOrderFulfillmentFunnel` (mock)
- **Features**: Porcentaje de pérdida en cada etapa

### 3. Pendientes por Estado
- **Component**: `BarChart` horizontal
- **Data Source**: `usePendingShipmentsByStatus` (mock)
- **Estados**: Listo para Recoger, Recogido, En Tránsito

### 4. Aceptación Pendiente de Vendedores
- **Component**: `Table` con `Badge` de color según tiempo de espera
- **Data Source**: Mock (`useSalesOrderMetrics`)
- **Colores**: 🟢 < 2 días, 🟡 2-7 días, 🔴 > 7 días
- **Interaction**: Ninguna (tabla estática)

### 5. Entregas Recientes
- **Component**: Resumen de badges (Entregados, En Tránsito, Fallidos) + tasa de cumplimiento
- **Data Source**: Mock (`useShipmentMetrics`)

## Estados

### Loading
- Skeleton para el embudo de cumplimiento
- Spinner para tablas

### Error
- "Datos de operaciones no disponibles — las apps de Shipping o Seller pueden estar caídas."

### Empty
```
┌─────────────────────────────────────────────────────────────────┐
│  No hay envíos activos. Todas las órdenes están cumplidas.      │
│                                                                  │
│  No hay órdenes pendientes de aceptación por parte de           │
│  vendedores. Todo está al día.                                  │
└─────────────────────────────────────────────────────────────────┘
```
