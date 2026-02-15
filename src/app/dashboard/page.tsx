import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "./_components/stat-card";
import { TopInterests } from "./_components/top-interests";
import { CampaignSection } from "./_components/campaign-section";
import { TimeAnalyticsDesign } from "./_components/time-analytics-design";
import { Users, Tags, Coffee } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const [customerCount, tagCount, topInterests, latestWeek] = await Promise.all([
    prisma.customer.count(),
    prisma.tag.count(),
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: {
        customers: {
          _count: "desc",
        },
      },
      take: 5,
    }),
    prisma.promoIdeaWeek.findFirst({
      orderBy: { weekStart: "desc" },
      include: {
        ideas: {
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
    }),
  ]);

  const campaignIdeas = (latestWeek?.ideas ?? []).map((idea) => ({
    id: idea.id,
    theme: idea.theme,
    segment: idea.segment,
    message: idea.message,
  }));

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description={`Selamat datang, ${session?.user?.name ?? "Admin"}!`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Customers"
          value={customerCount}
          description="Pelanggan aktif tersimpan"
          icon={Users}
        />

        <StatCard
          title="Total Tags"
          value={tagCount}
          description="Interest tags tersedia"
          icon={Tags}
        />

        <StatCard
          title="Kopi Kita"
          value="Mini CRM"
          description="AI Global Promo Helper"
          icon={Coffee}
          variant="highlight"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopInterests items={topInterests} />
        <CampaignSection ideas={campaignIdeas} />
      </div>

      <TimeAnalyticsDesign />
    </div>
  );
}
