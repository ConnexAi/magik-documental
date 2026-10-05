import { requirePageSession } from "@/lib/session";
import { getTemplates } from "@/lib/firestore";
import { TemplatesPageClient } from "@/components/magik/templates/templates-page-client";

export default async function TemplatesPage() {
  await requirePageSession();
  const result = await getTemplates();
  const templates = result.success ? result.data : [];

  return <TemplatesPageClient initialTemplates={templates} />;
}
