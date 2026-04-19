import { getUsers } from "@/lib/firestore";
import { UsersPageClient } from "@/components/magik/users/users-page-client";

export default async function UsersPage() {
  const result = await getUsers();
  const users = result.success ? result.data : [];

  return <UsersPageClient initialUsers={users} />;
}
