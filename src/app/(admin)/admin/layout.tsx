import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getAdminUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/forbidden");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div>
            <p className="text-sm font-medium">Panel administrativo</p>
            <p className="text-xs text-muted-foreground">
              Vista transversal del marketplace
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.firstName ?? user.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
