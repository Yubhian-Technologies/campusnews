"use client";

/**
 * Fixed bottom tab bar — dark, app-style, with the active tab shown in a rounded
 * highlight pill (Way2News-style). Order: Home · News · Reels · Location ·
 * College. (Categories is still reachable from Home/Profile, just not pinned
 * to the nav.)
 *
 * Location/College are deep links, not static: once the reader has starred a
 * favourite (LocationList/CollegeList), tapping the tab goes straight to that
 * feed instead of the picker — matching profile's "chosen location/college"
 * and the home carousel's Local/College News cards, which already do this.
 * `match` (not `href`) drives the active-pill highlight so it stays lit up
 * while browsing any location/college, not just the favourite one.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Clapperboard, MapPin, GraduationCap } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { FAVOURITE_COLLEGE_KEY, FAVOURITE_LOCATION_KEY } from "@/lib/prefs";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  /** Path prefix used for the active-pill check (falls back to `href`). */
  match: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  /** Extra path prefixes that also light up this tab. */
  alsoMatch?: string[];
}

export function NewsBottomNav() {
  const pathname = usePathname();
  const [favLocationId] = useLocalStorage(FAVOURITE_LOCATION_KEY);
  const [favCollegeId] = useLocalStorage(FAVOURITE_COLLEGE_KEY);

  const tabs: Tab[] = [
    { href: "/news", match: "/news", label: "Home", icon: Home, exact: true },
    { href: "/news/all", match: "/news/all", label: "News", icon: Newspaper },
    { href: "/news/reels", match: "/news/reels", label: "Reels", icon: Clapperboard },
    {
      href: favLocationId ? `/news/locations/${favLocationId}` : "/news/locations",
      match: "/news/locations",
      label: "Location",
      icon: MapPin,
    },
    {
      href: favCollegeId ? `/news/colleges/${favCollegeId}` : "/news/colleges",
      match: "/news/colleges",
      label: "College",
      icon: GraduationCap,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950">
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.match
            : pathname === tab.match ||
              pathname.startsWith(`${tab.match}/`) ||
              (tab.alsoMatch?.some((p) => pathname.startsWith(p)) ?? false);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.match}
              href={tab.href}
              className="flex flex-col items-center gap-1 py-2"
            >
              <span
                className={cn(
                  "grid place-items-center rounded-xl px-4 py-1.5 transition-colors",
                  active ? "bg-white/15 text-white" : "text-slate-400",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-white" : "text-slate-400",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
