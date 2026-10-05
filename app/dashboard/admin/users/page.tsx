import { requirePageAdmin } from "@/lib/session";
import { getUsers } from "@/lib/firestore";
import { UsersPageClient } from "@/components/magik/users/users-page-client";

export default async function UsersPage() {
  await requirePageAdmin();
  const result = await getUsers();
  const users = result.success ? result.data : [];

  return <UsersPageClient initialUsers={users} />;
}
