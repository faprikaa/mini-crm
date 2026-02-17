"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Tags,
  LogOut,
  Coffee,
  Sparkles,
  Bot,
  Package,
  ShoppingCart,
  LineChart,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/products", label: "Products", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/charts", label: "Charts", icon: LineChart },
  { href: "/promo-ideas", label: "Promo Ideas", icon: Sparkles },
  { href: "/ai-chat", label: "AI Chatbot", icon: Bot },
  { href: "/users", label: "Users", icon: UserCog },
];

interface AppSidebarProps {
  pathname: string;
}

export function AppSidebar({ pathname }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-main border-2 border-border rounded-base shadow-shadow flex items-center justify-center">
            <Coffee className="w-5 h-5 text-main-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg leading-tight">Kopi Kita</h1>
            <p className="text-xs text-foreground/60 font-base">Mini CRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full"
              tooltip="Keluar"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
