"use client";

import Link from "next/link";
import { Plus, Search, UserRound } from "lucide-react";
import { CampusVishnuLogo } from "@/components/brand/CampusVishnuLogo";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Slim app-style top bar for the mobile news experience. The "+" contribute
 * button is only shown to signed-in users who can actually post (Student
 * Contributors + staff roles) — hidden for guests and for plain reader
 * accounts (self-registered with a non-college email, no posting rights).
 */
export function NewsTopBar() {
  const { permissions, loading } = useAuth();
  const canContribute = !loading && permissions.includes("content:create");

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto grid h-14 max-w-xl grid-cols-3 items-center px-4">
        {/* left: contribute (signed-in contributors only) */}
        <div className="flex justify-start">
          {canContribute && (
            <Link
              href="/news/contribute"
              aria-label="Contribute"
              className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow hover:opacity-90"
            >
              <Plus className="size-5" />
            </Link>
          )}
        </div>

        {/* center: logo */}
        <div className="flex justify-center">
          <Link href="/news" aria-label="Campus Vishnu — home" className="text-white">
            <CampusVishnuLogo className="h-9 w-auto" />
          </Link>
        </div>

        {/* right: search + profile */}
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/news/search"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/news/profile"
            aria-label="Profile"
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <UserRound className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
