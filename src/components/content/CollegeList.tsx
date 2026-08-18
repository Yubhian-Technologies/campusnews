"use client";

/**
 * Colleges list with a device-remembered "favourite" college (localStorage),
 * mirroring LocationList — see there for the select-saves-favourite pattern
 * this follows.
 */
import Link from "next/link";
import { ChevronRight, GraduationCap, Star } from "lucide-react";
import type { OrgOption } from "@/lib/org/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { FAVOURITE_COLLEGE_KEY } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export function CollegeList({ colleges }: { colleges: OrgOption[] }) {
  const [favId, setFav] = useLocalStorage(FAVOURITE_COLLEGE_KEY);

  function toggleFav(id: string) {
    setFav(favId === id ? null : id);
  }

  // Tapping the row selects the college (unconditionally saves it as the
  // favourite), then the Link's own href navigates to its feed.
  function selectCollege(id: string) {
    setFav(id);
  }

  const fav = colleges.find((c) => c.id === favId) ?? null;
  const rest = colleges.filter((c) => c.id !== favId);

  if (colleges.length === 0) {
    return (
      <p className="rounded-2xl border bg-card px-4 py-6 text-sm text-muted-foreground">
        No colleges available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {fav && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Favourite college
          </h2>
          <Row
            college={fav}
            isFav
            onSelect={() => selectCollege(fav.id)}
            onToggleFav={() => toggleFav(fav.id)}
          />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          All colleges
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {rest.map((college, i) => (
            <Row
              key={college.id}
              college={college}
              isFav={false}
              onSelect={() => selectCollege(college.id)}
              onToggleFav={() => toggleFav(college.id)}
              divider={i > 0}
            />
          ))}
          {rest.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              That&apos;s your only college so far.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  college,
  isFav,
  onSelect,
  onToggleFav,
  divider,
}: {
  college: OrgOption;
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
          <GraduationCap className="size-5" />
        )}
      </button>
      <Link
        href={`/news/colleges/${college.id}`}
        onClick={onSelect}
        className="flex flex-1 items-center gap-2"
      >
        <span className="flex-1 font-medium">{college.name}</span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
