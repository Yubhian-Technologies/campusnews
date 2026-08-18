"use client";

/**
 * Locations list with a device-remembered "favourite" location (localStorage),
 * echoing Way2News's Favourite Locations. The favourite is pinned to the top
 * with a star. Tapping a row both selects it (saves as favourite) AND opens
 * its feed — that's the natural "choose this location" gesture; the star icon
 * is a secondary shortcut to unfavourite without navigating away.
 */
import Link from "next/link";
import { ChevronRight, MapPin, Star } from "lucide-react";
import type { OrgOption } from "@/lib/org/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { FAVOURITE_LOCATION_KEY } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const FAV_KEY = FAVOURITE_LOCATION_KEY;

export function LocationList({ locations }: { locations: OrgOption[] }) {
  const [favId, setFav] = useLocalStorage(FAV_KEY);

  function toggleFav(id: string) {
    setFav(favId === id ? null : id);
  }

  // Tapping the row selects the location (unconditionally saves it as the
  // favourite), then the Link's own href navigates to its feed.
  function selectLocation(id: string) {
    setFav(id);
  }

  const fav = locations.find((l) => l.id === favId) ?? null;
  const rest = locations.filter((l) => l.id !== favId);

  if (locations.length === 0) {
    return (
      <p className="rounded-2xl border bg-card px-4 py-6 text-sm text-muted-foreground">
        No locations available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {fav && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Favourite location
          </h2>
          <Row
            location={fav}
            isFav
            onSelect={() => selectLocation(fav.id)}
            onToggleFav={() => toggleFav(fav.id)}
          />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          All locations
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {rest.map((loc, i) => (
            <Row
              key={loc.id}
              location={loc}
              isFav={false}
              onSelect={() => selectLocation(loc.id)}
              onToggleFav={() => toggleFav(loc.id)}
              divider={i > 0}
            />
          ))}
          {rest.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              That&apos;s your only location so far.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  location,
  isFav,
  onSelect,
  onToggleFav,
  divider,
}: {
  location: OrgOption;
  isFav: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-card px-4 py-3.5",
        isFav ? "rounded-2xl border" : divider && "border-t",
      )}
    >
      <button
        type="button"
        onClick={onToggleFav}
        aria-label={isFav ? "Remove favourite" : "Set as favourite"}
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          isFav
            ? "bg-amber-500/15 text-amber-500"
            : "bg-muted text-muted-foreground hover:text-amber-500",
        )}
      >
        {isFav ? (
          <Star className="size-5 fill-amber-500" />
        ) : (
          <MapPin className="size-5" />
        )}
      </button>
      <Link
        href={`/news/locations/${location.id}`}
        onClick={onSelect}
        className="flex flex-1 items-center gap-2"
      >
        <span className="flex-1 font-medium">{location.name}</span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
