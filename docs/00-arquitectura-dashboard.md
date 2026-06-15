# Arquitectura del dashboard administrativo

## Decisiones

1. El dashboard no es dueño de datos de negocio y no tiene DB.
2. Cada app conserva la soberanía de su dominio.
3. Todas las lecturas se realizan por REST con `X-Service-Token`.
4. Clerk es compartido y el acceso requiere `publicMetadata.admin = true`.
5. Los tokens y URLs remotos solo se leen en Server Components o Route
   Handlers; nunca se exponen como variables `NEXT_PUBLIC_*`.
6. Un fallo en una app no impide mostrar el estado de las otras tres.

## Flujo de lectura

```text
Admin autenticado
  -> /admin
  -> getMarketplaceOverview()
  -> GET al recurso configurado de cada app
  -> normalización de { data, pagination }
  -> cards de disponibilidad y totales
```

Las vistas `/admin/apps/<app>` reutilizan TanStack Table para renderizar la
colección remota. A medida que se estabilice cada contrato, la tabla genérica
debe reemplazarse por columnas tipadas por dominio, siguiendo el patrón usado
en Shipping:

```text
types -> services/api -> hooks/querys -> columns -> DataTable
```

## Cambio requerido en las cuatro apps

Cada app debe agregar una variable entrante y aceptarla en sus endpoints
administrativos:

```env
DASHBOARD_TO_<APP>_SERVICE_TOKEN=<mismo valor configurado en dashboard>
```

Ejemplo conceptual:

```ts
const acceptedTokens = [
  process.env.EXISTING_INBOUND_TOKEN,
  process.env.DASHBOARD_TO_SHIPPING_SERVICE_TOKEN,
].filter(Boolean);
```

El nombre puede variar por repo, pero el secreto debe ser específico para el
par Dashboard -> App.
