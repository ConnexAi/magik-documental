import { requirePageSession } from "@/lib/session";
import { getCatalog } from "@/lib/firestore";
import { CatalogPageClient } from "@/components/magik/catalog/catalog-page-client";

export default async function CatalogPage() {
  await requirePageSession();
  const result = await getCatalog();
  const rubros = result.success ? result.data : [];

  return <CatalogPageClient initialRubros={rubros} />;
}
