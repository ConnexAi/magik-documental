import { notFound } from "next/navigation";
import { getEvent, getEventFiles } from "@/lib/firestore";
import { EventDetailClient } from "@/components/magik/events/event-detail-client";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [eventResult, filesResult] = await Promise.all([
    getEvent(params.id),
    getEventFiles(params.id),
  ]);

  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  return (
    <EventDetailClient
      event={eventResult.data}
      initialFiles={filesResult.success ? filesResult.data : []}
    />
  );
}
