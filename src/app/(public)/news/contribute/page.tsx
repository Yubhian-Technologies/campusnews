import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PenLine,
  Clapperboard,
  ArrowRight,
  Sparkles,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Contribute · CampusNews" };
export const revalidate = 0;

export default async function ContributePage() {
  // Contributing requires an account; send guests to sign in and back.
  const user = await getCurrentUser();
  if (!user || user.profile.status !== "ACTIVE") {
    redirect("/login?next=/news/contribute");
  }

  const firstName = user.profile.displayName?.split(" ")[0] ?? "there";
  const isStudent =
    user.profile.roleIds.includes("student") &&
    !user.profile.roleIds.some((r) =>
      ["reporter", "college_head", "location_news_head", "society_admin"].includes(r),
    );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(60% 70% at 15% 15%, #7c3aed 0%, transparent 60%), radial-gradient(55% 60% at 90% 25%, #db2777 0%, transparent 55%), radial-gradient(60% 70% at 70% 110%, #2563eb 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="size-3.5" />
            Contribute
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight">
            Hey {firstName}, share your story
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Post a blog or a reel to your campus community.
          </p>
        </div>
      </section>

      {/* Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionCard
          href="/newsroom/new"
          icon={<PenLine className="size-7" />}
          title="Write a blog"
          desc="Draft an article, then submit it for review."
          gradient="from-violet-500 to-purple-600"
          tint="bg-violet-500/10"
        />
        <OptionCard
          href="/news/contribute/reel"
          icon={<Clapperboard className="size-7" />}
          title="Upload a reel"
          desc="Share a short video, then submit it for review."
          gradient="from-pink-500 to-rose-600"
          tint="bg-pink-500/10"
        />
      </div>

      {/* How it works (students) */}
      {isStudent && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-bold">How your submission gets published</h2>
          <ol className="mt-4 space-y-4">
            <Step
              icon={<CheckCircle2 className="size-4" />}
              title="You submit"
              desc="Your blog or reel goes into review."
            />
            <Step
              icon={<UserCheck className="size-4" />}
              title="College Admin approves"
              desc="Your college admin reviews it — that's the only approval needed."
              last
            />
          </ol>
        </section>
      )}
    </div>
  );
}

function OptionCard({
  href,
  icon,
  title,
  desc,
  gradient,
  tint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient: string;
  tint: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${tint}`}
    >
      <span
        className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md ${gradient}`}
      >
        {icon}
      </span>
      <div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-foreground">
        Get started
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Step({
  icon,
  title,
  desc,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  last?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="pb-1">
        <p className="font-medium leading-tight">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
