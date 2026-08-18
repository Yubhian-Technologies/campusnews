import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { listLocations } from "@/lib/firebase/org";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { CategoryList } from "@/components/content/CategoryList";

export const metadata = { title: "Categories · CampusNews" };
export const revalidate = 60;

export default async function CategoriesPage() {
  const locations = await listLocations(DEFAULT_SOCIETY_ID);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Local
        </h2>
        {locations.length === 0 ? (
          <p className="rounded-2xl border bg-card px-4 py-6 text-sm text-muted-foreground">
            No locations yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            {locations.map((loc, i) => (
              <Link
                key={loc.id}
                href={`/news/locations/${loc.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent ${
                  i > 0 ? "border-t" : ""
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <MapPin className="size-5" />
                </span>
                <span className="flex-1 font-medium">{loc.name}</span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          News Categories
        </h2>
        <CategoryList />
      </section>
    </div>
  );
}
