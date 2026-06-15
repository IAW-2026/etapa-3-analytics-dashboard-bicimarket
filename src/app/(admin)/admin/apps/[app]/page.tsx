import { notFound } from "next/navigation";
import { RecordsTable } from "@/components/admin/records-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { normalizeCollection } from "@/lib/marketplace-overview";
import {
  getMarketplaceAppConfig,
  getServiceJson,
  MARKETPLACE_APPS,
  type MarketplaceApp,
} from "@/lib/service-auth";

export default async function AppDataPage({
  params,
}: {
  params: Promise<{ app: string }>;
}) {
  const { app } = await params;
  if (!MARKETPLACE_APPS.includes(app as MarketplaceApp)) notFound();

  const target = app as MarketplaceApp;
  const config = getMarketplaceAppConfig(target);
  let collection = { data: [] as Record<string, unknown>[], total: 0 };
  let error: string | null = null;

  try {
    collection = normalizeCollection(
      await getServiceJson<unknown>(target, config.resourcePath),
    );
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Integración remota</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {config.label}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recurso configurado: <code>{config.resourcePath}</code>
          </p>
        </div>
        <Badge variant="secondary">
          {collection.total.toLocaleString("es-AR")} registros
        </Badge>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo consultar {config.label}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <RecordsTable records={collection.data} />
      )}
    </div>
  );
}
