import { getEvents } from "@/lib/firestore";
import { EventsPageClient } from "@/components/magik/events/events-page-client";

export default async function EventsPage() {
  const result = await getEvents();
  const events = result.success ? result.data : [];

  return <EventsPageClient initialEvents={events} />;
}
