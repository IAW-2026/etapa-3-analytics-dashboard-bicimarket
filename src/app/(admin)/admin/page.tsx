import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMarketplaceOverview } from "@/lib/marketplace-overview";

export default async function AdminPage() {
  const overview = await getMarketplaceOverview();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">BiciMarket</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Estado del marketplace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Información consultada en tiempo real desde las cuatro aplicaciones.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Servicios disponibles</CardDescription>
            <CardTitle className="text-3xl">
              {overview.online} / 4
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Integraciones configuradas</CardDescription>
            <CardTitle className="text-3xl">
              {overview.configured} / 4
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Última actualización</CardDescription>
            <CardTitle className="text-lg">
              {new Intl.DateTimeFormat("es-AR", {
                dateStyle: "short",
                timeStyle: "medium",
              }).format(new Date(overview.generatedAt))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {overview.services.map((service) => (
          <Card key={service.app}>
            <CardHeader>
              <CardTitle>{service.label}</CardTitle>
              <CardDescription>
                {service.total === null
                  ? "Sin total disponible"
                  : `${service.total.toLocaleString("es-AR")} registros`}
              </CardDescription>
              <CardAction>
                <Badge
                  variant={service.online ? "default" : "secondary"}
                  className="gap-1"
                >
                  {service.online ? (
                    <CheckCircle2 className="size-3" />
                  ) : service.configured ? (
                    <AlertTriangle className="size-3" />
                  ) : (
                    <CircleDashed className="size-3" />
                  )}
                  {service.online
                    ? "Disponible"
                    : service.configured
                      ? "Con error"
                      : "Sin configurar"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="truncate text-xs text-muted-foreground">
                {service.error ?? "Conexión REST autenticada"}
              </p>
              <Link
                href={`/admin/apps/${service.app}`}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
              >
                Ver datos <ExternalLink className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
