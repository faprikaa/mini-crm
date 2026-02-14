import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  variant?: "default" | "highlight";
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const isHighlight = variant === "highlight";

  return (
    <Card
      className={`border-2 border-border shadow-shadow ${
        isHighlight ? "bg-main" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle
          className={`text-sm font-base ${
            isHighlight ? "text-main-foreground" : ""
          }`}
        >
          {title}
        </CardTitle>
        <Icon
          className={`h-5 w-5 ${
            isHighlight
              ? "text-main-foreground/60"
              : "text-foreground/60"
          }`}
        />
      </CardHeader>
      <CardContent>
        <div
          className={`${
            isHighlight ? "text-lg text-main-foreground" : "text-3xl"
          } font-heading`}
        >
          {value}
        </div>
        <p
          className={`text-xs font-base mt-1 ${
            isHighlight
              ? "text-main-foreground/60"
              : "text-foreground/60"
          }`}
        >
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
