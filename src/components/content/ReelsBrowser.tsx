"use client";

/**
 * Reels module browser with All / Saved tabs. Saved reels come from the signed-in
 * user's account; when signed out, the Saved tab shows an inline sign-in link
 * (no popup).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, LogIn } from "lucide-react";
import type { Reel } from "@/lib/content/reels";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchSavedReels } from "@/lib/api/reels-client";
import { ReelCard } from "./ReelCard";
import { cn } from "@/lib/utils";

type Tab = "all" | "saved";

export function ReelsBrowser({ reels }: { reels: Reel[] }) {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("all");
  const [savedIds, setSavedIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (!profile) return; // signed-out state handled by `signedIn` below
    fetchSavedReels()
      .then(setSavedIds)
      .catch(() => setSavedIds([]));
  }, [profile]);

  const savedReels = savedIds
    ? reels.filter((r) => savedIds.includes(r.id))
    : [];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="inline-flex rounded-full border p-1">
        {(["all", "saved"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "all" ? "All" : "Saved"}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      )}

      {tab === "saved" && (
        <SavedView
          loading={loading}
          signedIn={!!profile}
          reels={savedReels}
          fetched={savedIds !== null}
        />
      )}
    </div>
  );
}

function SavedView({
  loading,
  signedIn,
  reels,
  fetched,
}: {
  loading: boolean;
  signedIn: boolean;
  reels: Reel[];
  fetched: boolean;
}) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!signedIn) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-amber-500/15 text-amber-500">
          <Bookmark className="size-6" />
        </span>
        <div>
          <p className="font-medium">Save reels to your account</p>
          <p className="text-sm text-muted-foreground">
            Sign in to keep your favourite reels here.
          </p>
        </div>
        <Link
          href="/login?next=/news/reels"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <LogIn className="size-4" />
          Sign in
        </Link>
      </div>
    );
  }

  if (fetched && reels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-14 text-center">
        <p className="font-medium">No saved reels yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the bookmark on a reel to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
