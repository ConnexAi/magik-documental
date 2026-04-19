import { notFound } from "next/navigation";
import { getEvent } from "@/lib/firestore";
import { EventDetailClient } from "@/components/magik/events/event-detail-client";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getEvent(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <EventDetailClient event={result.data} />;
}
