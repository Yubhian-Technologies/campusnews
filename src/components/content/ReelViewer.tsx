"use client";

/**
 * Full-screen, TikTok-style vertical reel feed. Renders all reels in a
 * vertical snap-scroll overlay (fixed inset-0, above the app shell/nav),
 * starting at `startId`. The reel in view autoplays (muted by default);
 * others pause. Tap toggles play/pause; a control toggles sound.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  Share2,
  Heart,
  Bookmark,
} from "lucide-react";
import type { Reel } from "@/lib/content/reels";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLikes } from "@/components/likes/LikesProvider";
import { fetchSavedReels, toggleSavedReel } from "@/lib/api/reels-client";
import { ReelLikeButton } from "./ReelLikeButton";
import { ShareSheet } from "./ShareSheet";
import { cn } from "@/lib/utils";

export function ReelViewer({
  reels,
  startId,
}: {
  reels: Reel[];
  startId: string;
}) {
  const { profile, loading } = useAuth();
  const { isLiked, toggle: toggleLike } = useLikes();
  const router = useRouter();
  const [muted, setMuted] = useState(true);
  const [pausedId, setPausedId] = useState<string | null>(null);
  const [shareReel, setShareReel] = useState<Reel | null>(null);
  const [burstId, setBurstId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  // Which reel is in view (drives which videos get a real `src`) and which
  // is currently buffering (drives the spinner) — see the effect below.
  const [activeId, setActiveId] = useState(startId);
  const [bufferingId, setBufferingId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  // Distinguishes single tap (play/pause) from double tap (like).
  const tapRef = useRef<{ id: string; timer: ReturnType<typeof setTimeout> } | null>(
    null,
  );

  // Jump to the opened reel, then autoplay whichever reel is in view.
  useEffect(() => {
    document.getElementById(`reel-${startId}`)?.scrollIntoView();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.reelId;
          if (!id) continue;
          const video = videoRefs.current.get(id);
          if (!video) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveId(id);
            video.play().catch(() => {});
            setPausedId(null);
          } else {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );

    for (const reel of reels) {
      const el = document.getElementById(`reel-${reel.id}`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [reels, startId]);

  // Reflect the mute toggle onto the actual <video> elements (DOM, not state).
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      v.muted = muted;
    });
  }, [muted]);

  // Load the user's saved reels once they're known to be signed in; clear
  // immediately on sign-out instead of leaving the previous account's saved
  // bookmarks showing until the component remounts.
  useEffect(() => {
    if (!profile) {
      // Defer so we never setState synchronously inside an effect body.
      Promise.resolve().then(() => setSavedIds(new Set()));
      return;
    }
    fetchSavedReels()
      .then((ids) => setSavedIds(new Set(ids)))
      .catch(() => {});
  }, [profile]);

  async function toggleSave(reel: Reel) {
    if (loading) return;
    if (!profile) {
      // Not signed in → send them to login (no popup), return here after.
      router.push(`/login?next=${encodeURIComponent(`/news/reels/${reel.id}`)}`);
      return;
    }
    const willSave = !savedIds.has(reel.id);
    // Optimistic update; the filled bookmark is the feedback (no toast on success).
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(reel.id);
      else next.delete(reel.id);
      return next;
    });
    try {
      const ids = await toggleSavedReel(reel.id, willSave);
      setSavedIds(new Set(ids));
    } catch {
      // Revert on failure.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(reel.id);
        else next.add(reel.id);
        return next;
      });
      toast.error("Couldn't update saved. Please try again.");
    }
  }

  function togglePlay(reel: Reel) {
    const v = videoRefs.current.get(reel.id);
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPausedId(null);
    } else {
      v.pause();
      setPausedId(reel.id);
    }
  }

  function likeReel(reel: Reel) {
    if (!isLiked("reel", reel.id)) toggleLike("reel", reel.id); // double-tap always likes
    setBurstId(reel.id);
    setTimeout(() => setBurstId((cur) => (cur === reel.id ? null : cur)), 700);
  }

  /** Single tap → play/pause (deferred); double tap within 280ms → like. */
  function handleTap(reel: Reel) {
    const pending = tapRef.current;
    if (pending && pending.id === reel.id) {
      clearTimeout(pending.timer);
      tapRef.current = null;
      likeReel(reel);
      return;
    }
    const timer = setTimeout(() => {
      tapRef.current = null;
      togglePlay(reel);
    }, 280);
    tapRef.current = { id: reel.id, timer };
  }

  const activeIndex = reels.findIndex((r) => r.id === activeId);

  return (
    <div className="fixed inset-0 z-50 snap-y snap-mandatory overflow-y-scroll overscroll-contain bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Top controls */}
      <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <Link
          href="/news/reels"
          aria-label="Close reels"
          className="grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>

      {reels.map((reel, index) => {
        // Only the active reel and its immediate neighbors get a real `src`
        // (and preload eagerly) — this bounds simultaneous Storage
        // connections and lets the browser start buffering the next reel
        // before the user swipes to it, instead of every reel in the feed
        // fighting for bandwidth at once.
        const isNear = Math.abs(index - activeIndex) <= 1;
        return (
          <section
            key={reel.id}
            id={`reel-${reel.id}`}
            data-reel-id={reel.id}
            className="relative flex h-dvh w-full snap-start snap-always items-center justify-center"
          >
            <div className="relative h-full w-full max-w-md">
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(reel.id, el);
                }}
                src={isNear ? reel.videoUrl : undefined}
                preload={isNear ? "auto" : "none"}
                poster={reel.thumbnail}
                loop
                muted={muted}
                playsInline
                onWaiting={() => setBufferingId(reel.id)}
                onPlaying={() => setBufferingId((cur) => (cur === reel.id ? null : cur))}
                onClick={() => handleTap(reel)}
                className="size-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Buffering spinner — shown while the active reel has started
                  playing but is waiting on more data, so a slow network reads
                  as "loading" instead of a silent stall. */}
              {bufferingId === reel.id && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/40 backdrop-blur">
                  <span className="size-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </span>
              )}

              {/* Double-tap like burst */}
              {burstId === reel.id && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Heart className="animate-like-burst size-28 fill-rose-500 text-rose-500 drop-shadow-lg" />
                </span>
              )}

              {/* Paused indicator */}
              {pausedId === reel.id && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/20 backdrop-blur">
                  <Pause className="size-7 fill-white text-white" />
                </span>
              )}

              {/* Right action rail: like + share */}
              <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5">
                <ReelLikeButton reelId={reel.id} />
                <button
                  type="button"
                  onClick={() => toggleSave(reel)}
                  aria-pressed={savedIds.has(reel.id)}
                  aria-label={savedIds.has(reel.id) ? "Unsave reel" : "Save reel"}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-black/40 backdrop-blur transition-transform active:scale-90">
                    <Bookmark
                      className={cn(
                        "size-6",
                        savedIds.has(reel.id) && "fill-amber-400 text-amber-400",
                      )}
                    />
                  </span>
                  <span className="text-xs font-medium">
                    {savedIds.has(reel.id) ? "Saved" : "Save"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShareReel(reel)}
                  aria-label="Share reel"
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-black/40 backdrop-blur transition-transform active:scale-90">
                    <Share2 className="size-6" />
                  </span>
                  <span className="text-xs font-medium">Share</span>
                </button>
              </div>

              {/* Caption */}
              <div className="absolute inset-x-0 bottom-0 p-5 pb-8 pr-20">
                <h2 className="text-lg font-bold leading-snug text-white">
                  {reel.title}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
                  <Clock className="size-3.5" />
                  {reel.date}
                </p>
              </div>
            </div>
          </section>
        );
      })}

      <ShareSheet
        open={!!shareReel}
        onOpenChange={(o) => !o && setShareReel(null)}
        title={shareReel?.title ?? "CampusNews reel"}
        path={shareReel ? `/news/reels/${shareReel.id}` : "/news/reels"}
      />
    </div>
  );
}
