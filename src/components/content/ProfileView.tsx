"use client";

/**
 * Reader profile / menu screen (Way2News-style): Guest/account header, language
 * + chosen-location rows with a round arrow, an icon categories row, a menu
 * list, and a Likes section collecting the news + reels this device has liked
 * (likes are per-device in localStorage). Signed-in staff get sign out + a
 * dashboard link.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LogOut,
  Newspaper,
  Clapperboard,
  Bookmark,
  MapPin,
  Globe,
  ArrowRight,
  ChevronRight,
  LayoutDashboard,
  Sparkles,
  Building2,
  GraduationCap,
  Trophy,
  CalendarDays,
  Palette,
  Megaphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Article, ArticleCategory } from "@/lib/content/types";
import { ARTICLE_CATEGORIES, CATEGORY_LABELS } from "@/lib/content/types";
import { categoryStyle } from "@/lib/content/categoryStyle";
import type { Reel } from "@/lib/content/reels";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { FAVOURITE_COLLEGE_KEY, FAVOURITE_LOCATION_KEY } from "@/lib/prefs";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLikes } from "@/components/likes/LikesProvider";
import { ArticleCard } from "./ArticleCard";
import { ReelCard } from "./ReelCard";
import { cn } from "@/lib/utils";

interface ProfileUser {
  name: string;
  email: string;
  home: string;
}
interface LocationOption {
  id: string;
  name: string;
}

const CATEGORY_ICON: Record<ArticleCategory, LucideIcon> = {
  CAMPUS: Building2,
  ACADEMICS: GraduationCap,
  SPORTS: Trophy,
  EVENTS: CalendarDays,
  CULTURE: Palette,
  ANNOUNCEMENTS: Megaphone,
  OTHER: Newspaper,
};

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "G"
  );
}

export function ProfileView({
  user,
  articles,
  reels,
  locations,
  colleges,
}: {
  user: ProfileUser | null;
  articles: Article[];
  reels: Reel[];
  locations: LocationOption[];
  colleges: LocationOption[];
}) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [favId] = useLocalStorage(FAVOURITE_LOCATION_KEY);
  const favLocation = locations.find((l) => l.id === favId) ?? null;
  const [favCollegeId] = useLocalStorage(FAVOURITE_COLLEGE_KEY);
  const favCollege = colleges.find((c) => c.id === favCollegeId) ?? null;

  const { articleLikes, reelLikes } = useLikes();
  const likedNews = articles.filter((a) => articleLikes.has(a.slug));
  const likedReels = reels.filter((r) => reelLikes.has(r.id));

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <div className="-mx-4">
      {/* Account header */}
      <div className="flex items-center gap-4 px-4 py-5">
        {user ? (
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-bold text-white">
            {initials(user.name)}
          </span>
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-8" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold">{user?.name ?? "Guest"}</p>
          {user ? (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link
                href="/login?next=/news/profile"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>{" "}
              to like &amp; save across devices
            </p>
          )}
        </div>
        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="grid size-10 place-items-center rounded-full border text-muted-foreground hover:bg-accent"
          >
            <LogOut className="size-5" />
          </button>
        )}
      </div>

      {/* Language + location */}
      <PrefRow
        icon={<Globe className="size-6 text-muted-foreground" />}
        label="Your language"
        value="English"
      />
      <PrefRow
        icon={<MapPin className="size-6 text-muted-foreground" />}
        label="Your chosen location"
        value={favLocation ? `${favLocation.name} (Change)` : "Select a location"}
        href="/news/locations"
      />
      <PrefRow
        icon={<GraduationCap className="size-6 text-muted-foreground" />}
        label="Your college"
        value={favCollege ? `${favCollege.name} (Change)` : "Select a college"}
        href="/news/colleges"
      />

      {/* Categories */}
      <div className="px-4 pb-1 pt-5">
        <h2 className="text-xl font-bold tracking-tight">Categories</h2>
      </div>
      <div className="flex gap-5 overflow-x-auto px-4 pb-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CatTile href="/news" label="For you" icon={Sparkles} active />
        <CatTile href="/news/all" label="News" icon={Newspaper} />
        {ARTICLE_CATEGORIES.map((c) => (
          <CatTile
            key={c}
            href={`/news/category/${c}`}
            label={CATEGORY_LABELS[c]}
            icon={CATEGORY_ICON[c]}
            category={c}
          />
        ))}
      </div>

      {/* Menu list */}
      <div className="mt-2 border-t">
        <MenuRow href="/news/reels" icon={<Bookmark className="size-5" />} label="Saved reels" />
        <MenuRow href="/news/all" icon={<Newspaper className="size-5" />} label="All news" />
        {user && user.home !== "/news" && (
          <MenuRow
            href={user.home}
            icon={<LayoutDashboard className="size-5" />}
            label="Go to dashboard"
          />
        )}
      </div>

      {/* Likes */}
      <section className="space-y-4 px-4 py-6">
        <div className="flex items-center gap-2">
          <Heart className="size-5 fill-rose-500 text-rose-500" />
          <h2 className="text-xl font-bold tracking-tight">Likes</h2>
        </div>

        {likedNews.length === 0 && likedReels.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-14 text-center">
            <p className="font-medium">No likes yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Double-tap a reel or tap the heart on a story to like it.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Newspaper className="size-4" />
                Liked news ({likedNews.length})
              </div>
              {likedNews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No liked stories yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {likedNews.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Clapperboard className="size-4" />
                Liked reels ({likedReels.length})
              </div>
              {likedReels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No liked reels yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {likedReels.map((r) => (
                    <ReelCard key={r.id} reel={r} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function PrefRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="grid size-10 shrink-0 place-items-center">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm text-muted-foreground">{label}</span>
        <span className="block font-semibold text-primary">{value}</span>
      </span>
      {href && (
        <span className="grid size-9 place-items-center rounded-full bg-foreground text-background">
          <ArrowRight className="size-5" />
        </span>
      )}
    </>
  );
  const base = "flex items-center gap-3 border-t px-4 py-4";
  return href ? (
    <Link href={href} className={cn(base, "transition-colors hover:bg-accent")}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

function CatTile({
  href,
  label,
  icon: Icon,
  category,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  category?: ArticleCategory;
  active?: boolean;
}) {
  const style = category ? categoryStyle(category) : null;
  return (
    <Link href={href} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
      <span
        className={cn(
          "grid size-14 place-items-center rounded-2xl",
          active
            ? "bg-primary text-primary-foreground"
            : style
              ? cn(style.soft, style.text)
              : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-6" />
      </span>
      <span className="w-full truncate text-center text-xs font-medium">
        {label}
      </span>
    </Link>
  );
}

function MenuRow({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b px-4 py-4 transition-colors hover:bg-accent"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}
