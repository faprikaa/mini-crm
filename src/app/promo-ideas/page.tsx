import { promoIdeas } from "@/lib/promo-ideas";
import { PromoIdeasClient } from "./promo-ideas-client";

export default function PromoIdeasPage() {
  return <PromoIdeasClient ideas={promoIdeas} />;
}
