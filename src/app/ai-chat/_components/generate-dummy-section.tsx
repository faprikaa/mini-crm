"use client";

import { useState } from "react";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database, Info, Loader2 } from "lucide-react";

type GenerationMode = "new" | "existing" | "mixed";

const MODE_LABELS: Record<GenerationMode, { label: string; desc: string }> = {
    new: { label: "New", desc: "Buat data baru (tags, products, customers, sales)" },
    existing: { label: "Existing", desc: "Hanya tambah sales dari data yang sudah ada" },
    mixed: { label: "Mixed", desc: "Kombinasi data baru dan existing" },
};

export function GenerateDummySection() {
    const [mode, setMode] = useState<GenerationMode>("mixed");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);

    useBeforeUnload(isRunning);

    async function handleGenerate() {
        if (isRunning) return;

        setIsRunning(true);
        setOutput(null);

        try {
            const response = await fetch("/api/generate-dummy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode }),
            });

            const data = (await response.json()) as { output?: string; error?: string };

            if (data.error) {
                toast.error(data.error);
                return;
            }

            setOutput(data.output ?? "No output.");
            toast.success("Dummy data berhasil digenerate!");
        } catch {
            toast.error("Gagal menghubungi server.");
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <Card className="border-2 border-border shadow-shadow">
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Generate Dummy Data
                    </CardTitle>
                    <Badge className="w-fit border-2 border-border bg-secondary-background">
                        AI SQL Agent
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isRunning && (
                    <Alert className="bg-main/20 border-main text-foreground">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>⏳ AI Agent sedang bekerja... Jangan tinggalkan halaman ini sampai selesai.</strong>
                            <br />
                            Proses ini bisa memakan waktu <strong>1–3 menit</strong>.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-1.5 flex-1">
                        <label className="text-sm font-heading" htmlFor="dummy-mode-select">Mode</label>
                        <Select
                            value={mode}
                            onValueChange={(v) => setMode(v as GenerationMode)}
                            disabled={isRunning}
                        >
                            <SelectTrigger id="dummy-mode-select" className="w-full sm:w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(MODE_LABELS) as GenerationMode[]).map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {MODE_LABELS[key].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {MODE_LABELS[mode].desc}
                        </p>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isRunning}
                        className="w-full sm:w-auto"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Database className="h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                </div>

                {output && (
                    <div className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
                        <h4 className="text-sm font-heading mb-2">Output Agent:</h4>
                        <div className="whitespace-pre-wrap text-sm font-base leading-relaxed">
                            {output}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
