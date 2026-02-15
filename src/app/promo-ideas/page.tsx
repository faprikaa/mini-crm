import { getWeeklyPromoIdeas } from "@/lib/promo-ideas";
import { PromoIdeasClient } from "./promo-ideas-client";

export const dynamic = "force-dynamic";

export default async function PromoIdeasPage() {
  const ideas = await getWeeklyPromoIdeas();
  return <PromoIdeasClient ideas={ideas} />;
}
