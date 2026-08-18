"use client";

/**
 * Unified likes state. Likes never require login:
 *   - Guests like via localStorage (device-local).
 *   - Signed-in users' likes persist to their account (Firestore); on login any
 *     device-local likes are merged up, so nothing is lost.
 * A localStorage mirror is kept alongside the account so toggling stays instant,
 * but AuthProvider.signOut() clears it — a device starts clean after sign-out
 * rather than surfacing the previous account's likes to whoever uses it next.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToggledIds, writeLocalStorage } from "@/lib/useLocalStorage";
import { LIKED_ARTICLE_PREFIX, LIKED_REEL_PREFIX } from "@/lib/prefs";

export type LikeType = "article" | "reel";

const ARTICLE_PREFIX = LIKED_ARTICLE_PREFIX;
const REEL_PREFIX = LIKED_REEL_PREFIX;
const keyFor = (type: LikeType, id: string) =>
  (type === "article" ? ARTICLE_PREFIX : REEL_PREFIX) + id;

function readLocalIds(prefix: string): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix) && localStorage.getItem(k) === "1") {
      ids.push(k.slice(prefix.length));
    }
  }
  return ids;
}

interface LikesValue {
  articleLikes: Set<string>;
  reelLikes: Set<string>;
  isLiked: (type: LikeType, id: string) => boolean;
  toggle: (type: LikeType, id: string) => void;
}

const LikesContext = createContext<LikesValue | null>(null);

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const localArticle = useToggledIds(ARTICLE_PREFIX);
  const localReel = useToggledIds(REEL_PREFIX);
  const [acct, setAcct] = useState<{ articles: string[]; reels: string[] } | null>(
    null,
  );

  // On login, merge device likes into the account and load the merged set.
  useEffect(() => {
    if (!profile) return; // guests use the localStorage mirror below
    fetch("/api/me/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merge: {
          articles: readLocalIds(ARTICLE_PREFIX),
          reels: readLocalIds(REEL_PREFIX),
        },
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAcct({ articles: d.articles ?? [], reels: d.reels ?? [] }))
      .catch(() => {});
  }, [profile]);

  const accountMode = !!profile;
  const articleLikes = useMemo(
    () => new Set(accountMode && acct ? acct.articles : localArticle),
    [accountMode, acct, localArticle],
  );
  const reelLikes = useMemo(
    () => new Set(accountMode && acct ? acct.reels : localReel),
    [accountMode, acct, localReel],
  );

  const isLiked = useCallback(
    (type: LikeType, id: string) =>
      (type === "article" ? articleLikes : reelLikes).has(id),
    [articleLikes, reelLikes],
  );

  const toggle = useCallback(
    (type: LikeType, id: string) => {
      const current = (type === "article" ? articleLikes : reelLikes).has(id);
      const next = !current;
      // Always mirror to the device.
      writeLocalStorage(keyFor(type, id), next ? "1" : null);

      if (!accountMode) return; // guest: localStorage only

      // Optimistic account update, then persist.
      setAcct((prev) => {
        const base = prev ?? { articles: [...localArticle], reels: [...localReel] };
        const field = type === "article" ? "articles" : "reels";
        const set = new Set(base[field]);
        if (next) set.add(id);
        else set.delete(id);
        return { ...base, [field]: [...set] };
      });
      fetch("/api/me/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, like: next }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setAcct({ articles: d.articles ?? [], reels: d.reels ?? [] }))
        .catch(() => {});
    },
    [accountMode, articleLikes, reelLikes, localArticle, localReel],
  );

  const value = useMemo<LikesValue>(
    () => ({ articleLikes, reelLikes, isLiked, toggle }),
    [articleLikes, reelLikes, isLiked, toggle],
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes(): LikesValue {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error("useLikes must be used within <LikesProvider>.");
  return ctx;
}
