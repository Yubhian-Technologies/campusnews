import Link from "next/link";
import { Users, Inbox, ShieldCheck, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/lib/firebase/users";
import { listReviewQueueForUser } from "@/lib/firebase/articles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin · CampusNews" };

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(["society_admin"]);

  const [users, reviewQueue] = await Promise.all([
    listUsers(profile.societyId),
    listReviewQueueForUser(profile),
  ]);
  const active = users.filter((u) => u.status === "ACTIVE").length;
  const pending = users.filter((u) => u.status.startsWith("PENDING")).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {profile.displayName?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, roles, and content across your society.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={<Users className="size-5" />} />
        <StatCard label="Active" value={active} icon={<ShieldCheck className="size-5" />} />
        <StatCard label="Pending users" value={pending} icon={<UserCheck className="size-5" />} />
        <StatCard label="Pending approvals" value={reviewQueue.length} icon={<Inbox className="size-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User management</CardTitle>
            <CardDescription>
              Create internal users, assign roles and scope, and manage access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/users" />}>Go to Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newsroom</CardTitle>
            <CardDescription>
              Write, review, and publish articles across the society.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button render={<Link href="/newsroom" />}>Open Newsroom</Button>
            <Button render={<Link href="/newsroom/review" />} variant="outline">
              Review queue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Manage locations, colleges, and departments used for scope.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/org" />}>Manage org</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold">{value}</div>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
