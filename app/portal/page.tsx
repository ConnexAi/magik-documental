import { getPortfolioItems } from "@/lib/firestore";
import { PortalLanding } from "@/components/magik/portal/portal-landing";

export default async function PortalPage() {
  const result = await getPortfolioItems();
  const items = result.success ? result.data : [];
  return <PortalLanding items={items} />;
}
