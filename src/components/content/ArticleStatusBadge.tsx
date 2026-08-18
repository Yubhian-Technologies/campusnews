import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ArticleStatus } from "@/lib/content/types";

const STYLES: Record<ArticleStatus, string> = {
  DRAFT: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  SUBMITTED: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  PENDING_LOCATION: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-400",
  ARCHIVED: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent font-medium", STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
