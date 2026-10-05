import { getPortfolioItems } from "@/lib/firestore";
import { PortalLanding } from "@/components/magik/portal/portal-landing";

// Público, pero con datos vivos: sin esto se prerenderiza en el build y el
// portal no refleja los cambios del panel de portafolio hasta el siguiente deploy.
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const result = await getPortfolioItems();
  const items = result.success ? result.data : [];
  return <PortalLanding items={items} />;
}
