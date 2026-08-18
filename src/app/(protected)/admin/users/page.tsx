import { requirePermission } from "@/lib/auth/session";
import { listUsers } from "@/lib/firebase/users";
import { UsersConsole } from "./_components/UsersConsole";

export const metadata = { title: "Users · CampusNews" };

/**
 * Society Admin user-management console (spec §16). Server component fetches the
 * initial list (society-scoped) after re-verifying the users:read permission,
 * then hands off to the interactive client console.
 */
export default async function AdminUsersPage() {
  const { profile } = await requirePermission("users:read", {}, "/admin/users");
  const initialUsers = await listUsers(profile.societyId);

  return (
    <UsersConsole initialUsers={initialUsers} societyId={profile.societyId} />
  );
}
