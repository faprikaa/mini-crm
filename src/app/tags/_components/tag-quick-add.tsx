"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

interface TagQuickAddProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isPending: boolean;
}

export function TagQuickAdd({ onSubmit, isPending }: TagQuickAddProps) {
  const [quickTag, setQuickTag] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTag.trim()) return;

    const formData = new FormData();
    formData.set("name", quickTag.trim());

    await onSubmit(formData);
    setQuickTag("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
      <Input
        placeholder="Nama tag baru..."
        value={quickTag}
        onChange={(e) => setQuickTag(e.target.value)}
      />
      <Button type="submit" disabled={isPending || !quickTag.trim()}>
        <Plus className="w-4 h-4" />
        Tambah
      </Button>
    </form>
  );
}
