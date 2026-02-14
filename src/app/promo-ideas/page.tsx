import { getWeeklyPromoIdeas } from "@/lib/promo-ideas";
import { PromoIdeasClient } from "./promo-ideas-client";

export default async function PromoIdeasPage() {
  const ideas = await getWeeklyPromoIdeas();
  return <PromoIdeasClient ideas={ideas} />;
}
