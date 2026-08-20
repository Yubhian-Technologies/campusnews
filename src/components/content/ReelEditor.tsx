"use client";

/**
 * Edit an existing reel's title/video/thumbnail. Mirrors ArticleEditor's
 * editable-gate pattern: the author may edit their own DRAFT/REJECTED reel;
 * an in-scope reviewer (College/Location/Super Admin) may edit at any status
 * — see canEditReel. Replacing the video re-runs the same client-side
 * compression as a fresh upload (compressReelVideo).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ReelRecord } from "@/lib/content/reelTypes";
import type { UserProfile } from "@/lib/types";
import { canEditReel } from "@/lib/content/authorize";
import { updateReelClient, uploadReelAsset } from "@/lib/api/reels-upload-client";
import { compressReelVideo } from "@/lib/api/video-compress-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReelEditor({
  profile,
  reel,
  afterSaveHref = "/newsroom",
}: {
  profile: UserProfile;
  reel: ReelRecord;
  /** Where to navigate after a successful save. Defaults to the Newsroom's
   *  own article/reel list. */
  afterSaveHref?: string;
}) {
  const router = useRouter();
  const editable = canEditReel(profile, reel);

  const [title, setTitle] = useState(reel.title);
  const [videoUrl, setVideoUrl] = useState(reel.videoUrl);
  const [thumbnail, setThumbnail] = useState<string | null>(reel.thumbnail);
  const [busy, setBusy] = useState<null | "compressing" | "uploading" | "saving">(
    null,
  );
  const [compressProgress, setCompressProgress] = useState(0);

  async function handleReplaceVideo(file: File | null) {
    if (!file) return;
    try {
      setBusy("compressing");
      setCompressProgress(0);
      const compressed = await compressReelVideo(file, {
        onProgress: setCompressProgress,
      });
      setBusy("uploading");
      const url = await uploadReelAsset(compressed);
      setVideoUrl(url);
      toast.success("Video replaced — save to apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReplaceThumbnail(file: File | null) {
    if (!file) return;
    try {
      setBusy("uploading");
      const url = await uploadReelAsset(file);
      setThumbnail(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 4) {
      toast.error("Title must be at least 4 characters.");
      return;
    }
    setBusy("saving");
    try {
      await updateReelClient(reel.id, {
        title: title.trim(),
        videoUrl,
        thumbnail,
      });
      toast.success("Changes saved.");
      router.push(afterSaveHref);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-5">
      {!editable && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          This reel is {reel.status.toLowerCase()} and can no longer be edited
          here.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reel-edit-title">Title</Label>
        <Input
          id="reel-edit-title"
          value={title}
          disabled={!editable}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Video</Label>
        <video
          src={videoUrl}
          controls
          className="aspect-[9/16] max-h-80 w-full rounded-lg border bg-black object-contain"
        />
        {editable && (
          <>
            <Input
              type="file"
              accept="video/*"
              disabled={busy !== null}
              onChange={(e) => handleReplaceVideo(e.target.files?.[0] ?? null)}
            />
            {busy === "compressing" && (
              <div className="space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${Math.round(compressProgress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Compressing video…
                </p>
              </div>
            )}
            {busy === "uploading" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Uploading…
              </p>
            )}
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Thumbnail (optional)</Label>
        {thumbnail && (
          <div className="relative h-36 w-24 overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt="" className="size-full object-cover" />
          </div>
        )}
        {editable && (
          <Input
            type="file"
            accept="image/*"
            disabled={busy !== null}
            onChange={(e) => handleReplaceThumbnail(e.target.files?.[0] ?? null)}
          />
        )}
      </div>

      {editable && (
        <Button type="submit" disabled={busy !== null}>
          {busy === "saving" && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      )}
    </form>
  );
}
