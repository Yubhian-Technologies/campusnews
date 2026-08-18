import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { authorAutoPublishes } from "@/lib/content/authorize";
import { ReelUploadForm } from "@/components/content/ReelUploadForm";

export const metadata = { title: "Upload a reel · CampusNews" };
export const revalidate = 0;

export default async function ContributeReelPage() {
  const user = await getCurrentUser();
  if (!user || user.profile.status !== "ACTIVE") {
    redirect("/login?next=/news/contribute/reel");
  }

  const isStudent =
    user.profile.roleIds.includes("student") &&
    !user.profile.roleIds.some((r) =>
      ["reporter", "college_head", "location_news_head", "society_admin"].includes(r),
    );
  const autoPublish = authorAutoPublishes(user.profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload a reel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isStudent
            ? "Your reel goes to your College Admin for approval — that's the only step before it's published."
            : autoPublish
              ? "Your reel publishes immediately once uploaded."
              : "Upload a short video for review."}
        </p>
      </div>
      <ReelUploadForm />
    </div>
  );
}
