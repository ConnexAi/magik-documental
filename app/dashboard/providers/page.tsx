import { requirePageSession } from "@/lib/session";
import { getProviders } from "@/lib/firestore";
import { ProvidersPageClient } from "@/components/magik/providers/providers-page-client";

export default async function ProvidersPage() {
  await requirePageSession();
  const result = await getProviders();
  const providers = result.success ? result.data : [];

  return <ProvidersPageClient initialProviders={providers} />;
}
