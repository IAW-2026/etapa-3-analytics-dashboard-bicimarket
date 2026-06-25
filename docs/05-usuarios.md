# 1.5 — Usuarios y autenticación (resumen)

> Resumen para contexto AI. Detalle completo en `proyecto-c-etapa-1-bicimarket/preview/05-usuarios.md`.

## Decisión clave

**Todas las apps usan el mismo proyecto de Clerk**. La identidad y el rol se
resuelven mediante `publicMetadata`.

| App | Rol |
|---|---|---|
| Buyer | `buyer` |
| Seller | `seller` |
| Shipping | `logistics` |
| Payments | `admin` |
| Dashboard | `admin` |

El dashboard exige `publicMetadata.admin = true`. No crea un usuario local ni
realiza provisioning porque no tiene base de datos propia.

## `admin`

Rol transversal. Vive en `publicMetadata.admin: true` en el Clerk compartido.

## Provisioning de usuarios (perezoso, sin webhooks)

> No usamos webhooks de Clerk. La sincronización Clerk → DB local se hace al primer login del usuario.

Implementación en este template: `src/lib/auth.ts` exporta `getOrCreateLocalUser()`. Cualquier page server-side la llama, lee los claims del JWT y hace `prisma.user.upsert(...)`. Si los datos cambiaron en Clerk Dashboard, se reflejan en el próximo login.

## Identidad cruzada (`user_links`)

Un mismo humano puede tener cuenta en Clerk-Buyer **y** Clerk-Seller (mismo email). Las apps que reciben usuarios de otras apps (Payments, Feedback) mantienen una tabla `user_links` que correlaciona por email verificado:

```ts
user_links {
  local_clerk_user_id,
  external_app: "buyer" | "seller" | ...,
  external_clerk_user_id,
  email,
  linked_at
}
```

Buyer, Seller y Shipping **no necesitan** esta tabla en Etapa 1.

## Flujos de alta

- **Comprador**: signup en Clerk-Buyer → primer login → `buyer_profile` creado activo.
- **Vendedor**: signup en Clerk-Seller → primer login → `seller_profile` creado con `verification_status=pending_review` → admin aprueba → puede activar productos.
- **Operador logístico**: admin invita por email desde Clerk-Shipping → operador acepta → admin crea `logistics_operator` con `POST /api/v1/logistics-operators` (no se autoprovisiona).

## Variables de entorno por fork

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Cada fork las completa con su propio Clerk. Ver `.env.example`.
