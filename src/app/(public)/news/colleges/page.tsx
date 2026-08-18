import { listColleges } from "@/lib/firebase/org";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { CollegeList } from "@/components/content/CollegeList";

export const metadata = { title: "Colleges · CampusNews" };
export const revalidate = 60;

export default async function CollegesPage() {
  const colleges = await listColleges(DEFAULT_SOCIETY_ID);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Colleges</h1>
      <CollegeList colleges={colleges.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
