"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coffee, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-main border-2 border-border rounded-base shadow-shadow mb-4">
            <Coffee className="w-8 h-8 text-main-foreground" />
          </div>
          <h1 className="text-3xl font-heading tracking-tight">Kopi Kita</h1>
          <p className="text-foreground/70 font-base mt-1">
            Mini CRM — AI Global Promo Helper
          </p>
        </div>

        <Card className="border-2 border-border shadow-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-heading">Login</CardTitle>
            <CardDescription className="font-base">
              Masuk ke dashboard untuk mengelola data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state?.error && (
              <Alert className="mb-4 border-2 border-border bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-base">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@kopikita.com"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-base">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? "Masuk..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-foreground/50 mt-6 font-base">
          Kopi Kita &copy; {new Date().getFullYear()} — All rights reserved
        </p>
      </div>
    </div>
  );
}
