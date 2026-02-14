"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { PromoCard } from "./_components/promo-card";
import { PromoLibrary } from "./_components/promo-library";
import type { PromoIdea } from "@/lib/promo-ideas";

export function PromoIdeasClient({ ideas }: { ideas: PromoIdea[] }) {
  const [activeTab, setActiveTab] = useState("recommended");

  async function copyMessage(message: string) {
    await navigator.clipboard.writeText(message);
    toast.success("Pesan promo berhasil disalin.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promo Ideas"
        description="Halaman frontend untuk simulasi rekomendasi kampanye mingguan."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="recommended">Rekomendasi Minggu Ini</TabsTrigger>
          <TabsTrigger value="library">Library Pesan</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {ideas.map((idea) => (
            <PromoCard key={idea.id} idea={idea} onCopy={copyMessage} />
          ))}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <PromoLibrary ideas={ideas} onCopy={copyMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
