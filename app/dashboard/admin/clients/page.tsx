import { requirePageAdmin } from "@/lib/session";
import { getClients } from "@/lib/firestore";
import { ClientsPageClient } from "@/components/magik/clients/clients-page-client";

export default async function ClientsPage() {
  await requirePageAdmin();
  const result = await getClients();
  return <ClientsPageClient initialClients={result.success ? result.data : []} />;
}
