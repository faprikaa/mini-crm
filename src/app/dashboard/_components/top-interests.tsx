import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopInterest {
  id: string;
  name: string;
  _count: {
    customerTags: number;
  };
}

interface TopInterestsProps {
  items: TopInterest[];
}

export function TopInterests({ items }: TopInterestsProps) {
  return (
    <Card className="border-2 border-border shadow-shadow">
      <CardHeader>
        <CardTitle className="text-xl">Top Interests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="font-base text-foreground/70">
            Belum ada data minat customer.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-base border-2 border-border bg-secondary-background px-3 py-2"
            >
              <span className="font-base">{item.name}</span>
              <Badge className="border-2 border-border bg-main text-main-foreground">
                {item._count.customerTags}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

