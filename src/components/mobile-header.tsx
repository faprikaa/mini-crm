"use client";

import { Button } from "@/components/ui/button";
import { Menu, X, Coffee } from "lucide-react";

interface MobileHeaderProps {
  sidebarOpen: boolean;
  onToggle: () => void;
}

export function MobileHeader({ sidebarOpen, onToggle }: MobileHeaderProps) {
  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b-2 border-border bg-secondary-background">
      <div className="flex items-center gap-2">
        <Coffee className="w-6 h-6" />
        <span className="font-heading text-lg">Kopi Kita</span>
      </div>
      <Button
        variant="neutral"
        size="icon"
        onClick={onToggle}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
    </div>
  );
}
