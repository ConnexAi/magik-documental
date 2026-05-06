import { getClients } from "@/lib/firestore";
import { ClientsPageClient } from "@/components/magik/clients/clients-page-client";

export default async function ClientsPage() {
  const result = await getClients();
  return <ClientsPageClient initialClients={result.success ? result.data : []} />;
}
