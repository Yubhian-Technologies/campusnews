import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authoritative server-side gate: society_admin only (spec §9).
  await requireRole(["society_admin"], "/admin");

  return (
    <DashboardShell
      title="Super Admin"
      nav={
        <>
          <Button render={<Link href="/admin" />} variant="ghost" size="sm">
            Overview
          </Button>
          <Button render={<Link href="/admin/users" />} variant="ghost" size="sm">
            Users
          </Button>
          <Button render={<Link href="/admin/org" />} variant="ghost" size="sm">
            Organization
          </Button>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
