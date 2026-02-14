"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader 
        sidebarOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      <div className="flex">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          pathname={pathname} 
        />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-overlay z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen lg:min-h-screen">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
