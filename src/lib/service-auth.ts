import { NextRequest, NextResponse } from "next/server";

export const MARKETPLACE_APPS = [
  "buyer",
  "seller",
  "shipping",
  "payments",
] as const;

export type MarketplaceApp = (typeof MARKETPLACE_APPS)[number];

const APP_CONFIG: Record<
  MarketplaceApp,
  { label: string; defaultResourcePath: string }
> = {
  buyer: {
    label: "Compras",
    defaultResourcePath: "/api/v1/orders?page=1&limit=20",
  },
  seller: {
    label: "Ventas",
    defaultResourcePath: "/api/v1/products?page=1&limit=20",
  },
  shipping: {
    label: "Envíos",
    defaultResourcePath:
      "/api/v1/admin/shipment-groups?page=1&per_page=20",
  },
  payments: {
    label: "Pagos",
    defaultResourcePath: "/api/v1/payments?page=1&limit=20",
  },
};

export class ServiceApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly app: MarketplaceApp,
  ) {
    super(message);
  }
}

export function requireServiceToken(req: NextRequest) {
  const expected = process.env.DASHBOARD_INCOMING_SERVICE_TOKEN;
  const received = req.headers.get("x-service-token");

  if (!expected) {
    return NextResponse.json(
      {
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "DASHBOARD_INCOMING_SERVICE_TOKEN no está configurado",
        },
      },
      { status: 500 },
    );
  }

  if (!received || received !== expected) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "X-Service-Token inválido o ausente",
        },
      },
      { status: 401 },
    );
  }

  return null;
}

function getAppEnvName(app: MarketplaceApp, suffix: string) {
  return `${app.toUpperCase()}_${suffix}`;
}

export function getMarketplaceAppConfig(app: MarketplaceApp) {
  const config = APP_CONFIG[app];
  const baseUrl = process.env[getAppEnvName(app, "API_URL")]?.replace(/\/$/, "");
  const token =
    process.env[`DASHBOARD_TO_${app.toUpperCase()}_SERVICE_TOKEN`];
  const resourcePath =
    process.env[getAppEnvName(app, "ADMIN_RESOURCE_PATH")] ??
    config.defaultResourcePath;

  return {
    ...config,
    baseUrl,
    token,
    resourcePath,
    configured: Boolean(baseUrl && token),
  };
}

type ServiceFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
};

export async function callServiceApi(
  app: MarketplaceApp,
  path: string,
  options: ServiceFetchOptions = {},
) {
  const config = getMarketplaceAppConfig(app);
  if (!config.baseUrl || !config.token) {
    throw new ServiceApiError(
      `Falta configurar ${app.toUpperCase()}_API_URL o DASHBOARD_TO_${app.toUpperCase()}_SERVICE_TOKEN`,
      503,
      app,
    );
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": config.token,
      "X-Request-Id": crypto.randomUUID(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
  });

  if (!response.ok) {
    throw new ServiceApiError(
      `${config.label} respondió HTTP ${response.status}`,
      response.status,
      app,
    );
  }

  return response;
}

export async function getServiceJson<T>(
  app: MarketplaceApp,
  path: string,
): Promise<T> {
  const response = await callServiceApi(app, path);
  return response.json() as Promise<T>;
}
