"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  CreditCard,
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  Truck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  { title: "Resumen", href: "/admin", icon: LayoutDashboard },
  { title: "Compras", href: "/admin/apps/buyer", icon: ShoppingCart },
  { title: "Ventas", href: "/admin/apps/seller", icon: PackageSearch },
  { title: "Envíos", href: "/admin/apps/shipping", icon: Truck },
  { title: "Pagos", href: "/admin/apps/payments", icon: CreditCard },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin" />}
              tooltip="BiciMarket Admin"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Bike className="size-4" />
              </span>
              <span className="grid text-left leading-tight">
                <span className="font-semibold">BiciMarket</span>
                <span className="text-xs opacity-70">Administración</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
