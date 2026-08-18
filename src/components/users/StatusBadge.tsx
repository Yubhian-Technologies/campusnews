import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/types";

const STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  INACTIVE: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  SUSPENDED: "bg-red-500/15 text-red-700 dark:text-red-400",
  PENDING_APPROVAL: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  PENDING_EMAIL_VERIFICATION:
    "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  PENDING_APPROVAL: "Pending approval",
  PENDING_EMAIL_VERIFICATION: "Pending verification",
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent font-medium", STATUS_STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
