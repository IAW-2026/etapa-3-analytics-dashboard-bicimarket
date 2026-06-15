import {
  getMarketplaceAppConfig,
  getServiceJson,
  MARKETPLACE_APPS,
  type MarketplaceApp,
} from "@/lib/service-auth";

export type ServiceOverview = {
  app: MarketplaceApp;
  label: string;
  configured: boolean;
  online: boolean;
  total: number | null;
  error: string | null;
};

function readTotal(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const pagination = record.pagination;

  if (pagination && typeof pagination === "object") {
    const total = (pagination as Record<string, unknown>).total;
    if (typeof total === "number") return total;
  }

  if (Array.isArray(record.data)) return record.data.length;
  return null;
}

async function inspectService(app: MarketplaceApp): Promise<ServiceOverview> {
  const config = getMarketplaceAppConfig(app);
  if (!config.configured) {
    return {
      app,
      label: config.label,
      configured: false,
      online: false,
      total: null,
      error: "Faltan URL o token",
    };
  }

  try {
    const payload = await getServiceJson<unknown>(app, config.resourcePath);
    return {
      app,
      label: config.label,
      configured: true,
      online: true,
      total: readTotal(payload),
      error: null,
    };
  } catch (error) {
    return {
      app,
      label: config.label,
      configured: true,
      online: false,
      total: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getMarketplaceOverview() {
  const services = await Promise.all(MARKETPLACE_APPS.map(inspectService));

  return {
    services,
    online: services.filter((service) => service.online).length,
    configured: services.filter((service) => service.configured).length,
    generatedAt: new Date().toISOString(),
  };
}

export function normalizeCollection(payload: unknown): {
  data: Record<string, unknown>[];
  total: number;
} {
  if (!payload || typeof payload !== "object") return { data: [], total: 0 };
  const record = payload as Record<string, unknown>;
  const data = Array.isArray(record.data)
    ? record.data.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : [];

  return { data, total: readTotal(payload) ?? data.length };
}
