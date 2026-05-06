import { getAllPortfolioItems } from "@/lib/firestore";
import { PortfolioAdminClient } from "@/components/magik/portal/portfolio-admin-client";

export default async function PortfolioAdminPage() {
  const result = await getAllPortfolioItems();
  return (
    <PortfolioAdminClient initialItems={result.success ? result.data : []} />
  );
}
