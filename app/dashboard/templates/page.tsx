import { getTemplates } from "@/lib/firestore";
import { TemplatesPageClient } from "@/components/magik/templates/templates-page-client";

export default async function TemplatesPage() {
  const result = await getTemplates();
  const templates = result.success ? result.data : [];

  return <TemplatesPageClient initialTemplates={templates} />;
}
