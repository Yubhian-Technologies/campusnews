import { listLocations } from "@/lib/firebase/org";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { LocationList } from "@/components/content/LocationList";

export const metadata = { title: "Locations · CampusNews" };
export const revalidate = 60;

export default async function LocationsPage() {
  const locations = await listLocations(DEFAULT_SOCIETY_ID);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
      <LocationList
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  );
}
