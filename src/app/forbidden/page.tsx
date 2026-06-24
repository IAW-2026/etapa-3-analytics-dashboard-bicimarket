import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut, ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldX className="size-12 text-destructive" />
      <h1 className="text-3xl font-semibold">Acceso restringido</h1>
      <p className="max-w-md text-muted-foreground">
        Tu cuenta está autenticada, pero necesita
        {" "}<code>publicMetadata.admin = true</code> en Clerk.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Volver
        </Link>
        <SignOutButton redirectUrl="/sign-in">
          <button type="button" className={buttonVariants({ variant: "destructive" })}>
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}
