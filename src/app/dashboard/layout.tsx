"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} />
      <SidebarInset className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b-2 border-border bg-secondary-background px-4 py-3 lg:px-6">
          <SidebarTrigger className="h-9 w-9" />
        </header>
        <main className="flex-1">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
