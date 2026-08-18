"use client";

/**
 * Read/write a single localStorage string via useSyncExternalStore — the
 * React-blessed pattern for external stores. SSR-safe (server snapshot is null)
 * and syncs across components/tabs, without setState-in-effect.
 */
import { useCallback, useSyncExternalStore } from "react";

const EVENT = "campusnews:local-storage";

function subscribeStore(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/**
 * Return the ids of all localStorage entries under `prefix` whose value is "1"
 * (i.e. liked/toggled-on). Used to collect liked news/reels for the profile.
 * The snapshot is a stable comma-joined string so useSyncExternalStore doesn't
 * loop.
 */
export function useToggledIds(prefix: string): string[] {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return "";
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix) && localStorage.getItem(key) === "1") {
        ids.push(key.slice(prefix.length));
      }
    }
    return ids.sort().join(",");
  }, [prefix]);

  const snap = useSyncExternalStore(subscribeStore, getSnapshot, () => "");
  return snap ? snap.split(",") : [];
}

/**
 * Write a localStorage value and notify all useLocalStorage subscribers — use
 * this to update state from outside a component that holds the hook (e.g. a
 * double-tap gesture updating a like the Like button also renders).
 */
export function writeLocalStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
  window.dispatchEvent(new Event(EVENT));
}

/** Remove every localStorage entry under `prefix` (e.g. clearing all liked
 *  article/reel ids on sign-out) and notify subscribers once. */
export function clearLocalStoragePrefix(prefix: string) {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  for (const key of keys) localStorage.removeItem(key);
  window.dispatchEvent(new Event(EVENT));
}

export function useLocalStorage(
  key: string,
): [string | null, (value: string | null) => void] {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof window === "undefined") return () => {};
      const handler = (e: Event) => {
        if (e instanceof StorageEvent && e.key !== null && e.key !== key) return;
        cb();
      };
      window.addEventListener("storage", handler);
      window.addEventListener(EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(EVENT, handler);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(
    () => (typeof window === "undefined" ? null : localStorage.getItem(key)),
    [key],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const setValue = useCallback(
    (next: string | null) => writeLocalStorage(key, next),
    [key],
  );

  return [value, setValue];
}
