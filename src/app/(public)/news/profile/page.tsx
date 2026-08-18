import { listPublishedArticles } from "@/lib/firebase/articles";
import { listColleges, listLocations } from "@/lib/firebase/org";
import { getPublicReels } from "@/lib/firebase/reels";
import { DEFAULT_SOCIETY_ID } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/session";
import { homeRouteForRoles } from "@/lib/auth/roles";
import { ProfileView } from "@/components/content/ProfileView";

export const metadata = { title: "Profile · CampusNews" };
export const revalidate = 0;

export default async function ProfilePage() {
  const [articles, locations, colleges, reels, current] = await Promise.all([
    listPublishedArticles(DEFAULT_SOCIETY_ID),
    listLocations(DEFAULT_SOCIETY_ID),
    listColleges(DEFAULT_SOCIETY_ID),
    getPublicReels(DEFAULT_SOCIETY_ID),
    getCurrentUser(),
  ]);

  const user =
    current && current.profile.status === "ACTIVE"
      ? {
          name: current.profile.displayName,
          email: current.profile.email,
          home: homeRouteForRoles(current.profile.roleIds),
        }
      : null;

  return (
    <ProfileView
      user={user}
      articles={articles}
      reels={reels}
      locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      colleges={colleges.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
