import { cn } from "@/lib/utils";

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function formatDate(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Author avatar (colored initials) + name + date. */
export function Byline({
  name,
  date,
  size = "sm",
  className,
}: {
  name: string;
  date: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-semibold text-white",
          size === "md" ? "size-10 text-sm" : "size-8 text-xs",
        )}
        aria-hidden
      >
        {initials(name)}
      </span>
      <div className="min-w-0 leading-tight">
        <div
          className={cn(
            "truncate font-medium",
            size === "md" ? "text-sm" : "text-xs",
          )}
        >
          {name}
        </div>
        <div className="text-xs text-muted-foreground">{formatDate(date)}</div>
      </div>
    </div>
  );
}
