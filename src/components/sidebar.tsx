"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Tags,
  LogOut,
  Coffee,
  Sparkles,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/promo-ideas", label: "Promo Ideas", icon: Sparkles },
  { href: "/ai-chat", label: "AI Chatbot", icon: Bot },
];

interface SidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
  pathname: string;
}

export function Sidebar({ sidebarOpen, onClose, pathname }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-secondary-background border-r-2 border-border transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 border-b-2 border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-main border-2 border-border rounded-base shadow-shadow flex items-center justify-center">
            <Coffee className="w-5 h-5 text-main-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg leading-tight">Kopi Kita</h1>
            <p className="text-xs text-foreground/60 font-base">Mini CRM</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-base border-2 transition-all font-base text-sm",
                isActive
                  ? "bg-main text-main-foreground border-border shadow-shadow"
                  : "border-transparent hover:bg-background hover:border-border"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-border">
        <Button
          variant="neutral"
          className="w-full justify-start gap-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
