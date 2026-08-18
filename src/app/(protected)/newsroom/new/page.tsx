import Link from "next/link";
import { ChevronRight, PenLine, CalendarDays, Clapperboard } from "lucide-react";
import { requireRole } from "@/lib/auth/session";

export const metadata = { title: "New post · CampusNews" };

const OPTIONS = [
  {
    href: "/newsroom/new/article",
    icon: PenLine,
    title: "Blog / News",
    desc: "Write an article for the newsroom.",
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  {
    href: "/newsroom/new/event",
    icon: CalendarDays,
    title: "Event",
    desc: "Announce a campus event.",
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  {
    href: "/newsroom/new/reel",
    icon: Clapperboard,
    title: "Reel",
    desc: "Upload a short video.",
    tint: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
  },
] as const;

export default async function NewPostChooserPage() {
  await requireRole(
    ["reporter", "student", "college_head", "location_news_head", "society_admin"],
    "/newsroom/new",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What would you like to create?
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent"
          >
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-xl ${opt.tint}`}
            >
              <opt.icon className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{opt.title}</span>
              <span className="block text-sm text-muted-foreground">
                {opt.desc}
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
