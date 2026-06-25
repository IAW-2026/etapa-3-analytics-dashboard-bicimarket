"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bike,
  Bot,
  LayoutDashboard,
  Package,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react"
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
} from "@/components/ui/sidebar"

const mainNav = [
  { title: "Panel General", href: "/admin", icon: LayoutDashboard },
  { title: "Ventas", href: "/admin/sales", icon: TrendingUp },
  { title: "Finanzas", href: "/admin/finance", icon: Wallet },
  { title: "Operaciones", href: "/admin/operations", icon: Truck },
  { title: "Productos", href: "/admin/products", icon: Package },
  { title: "Vendedores", href: "/admin/sellers", icon: Store },
  { title: "Clientes", href: "/admin/customers", icon: Users },
  { title: "Copilot IA", href: "/admin/copilot", icon: Bot },
] as const

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:hidden">
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
          <SidebarGroupLabel>Analítica</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)
                    }
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
  )
}
