import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bike, ShieldCheck } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Bike className="size-6 text-primary" />
          </div>
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">
            BiciMarket Admin
          </CardTitle>
          <CardDescription>
            Operación central de compras, ventas, envíos y pagos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Iniciar Sesion
          </Link>
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Acceso exclusivo para administradores
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
