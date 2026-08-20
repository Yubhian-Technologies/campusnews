"use client";

/**
 * Reel contribution: upload a video (+ optional thumbnail) to Firebase Storage,
 * then create & submit the reel. Super Admin / Location Admin / College Admin
 * authors publish immediately; Student/Reporter go to review (Student needs
 * College Admin approval — see authorAutoPublishes). Shows the contributor's
 * own reels with their current status.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, UploadCloud, Film, Rocket } from "lucide-react";
import type { ReelRecord } from "@/lib/content/reelTypes";
import { STATUS_LABELS } from "@/lib/content/types";
import { authorAutoPublishes } from "@/lib/content/authorize";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createReelClient,
  listMyReels,
  submitReelClient,
  uploadReelAsset,
} from "@/lib/api/reels-upload-client";
import { compressReelVideo } from "@/lib/api/video-compress-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ReelUploadForm() {
  const { profile } = useAuth();
  const autoPublish = profile ? authorAutoPublishes(profile) : false;
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [busy, setBusy] = useState<null | "compressing" | "uploading" | "saving">(
    null,
  );
  const [compressProgress, setCompressProgress] = useState(0);
  const [mine, setMine] = useState<ReelRecord[]>([]);

  useEffect(() => {
    listMyReels()
      .then(setMine)
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 4) {
      toast.error("Give your reel a title (at least 4 characters).");
      return;
    }
    if (!video) {
      toast.error("Choose a video to upload.");
      return;
    }
    try {
      setBusy("compressing");
      setCompressProgress(0);
      const compressedVideo = await compressReelVideo(video, {
        onProgress: setCompressProgress,
      });

      setBusy("uploading");
      const videoUrl = await uploadReelAsset(compressedVideo);
      const thumbnail = thumb ? await uploadReelAsset(thumb) : null;
      setBusy("saving");
      const id = await createReelClient({
        title: title.trim(),
        videoUrl,
        thumbnail,
        locationId: null,
        collegeId: null,
        departmentId: null,
      });
      await submitReelClient(id);
      toast.success(autoPublish ? "Reel published." : "Reel submitted for review.");
      setTitle("");
      setVideo(null);
      setThumb(null);
      setMine(await listMyReels());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reel-title">Title</Label>
          <Input
            id="reel-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A short, catchy title"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reel-video">Video</Label>
          <Input
            id="reel-video"
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Vertical videos look best. Max 200MB.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reel-thumb">Thumbnail (optional)</Label>
          <Input
            id="reel-thumb"
            type="file"
            accept="image/*"
            onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
          />
        </div>

        {busy === "compressing" && (
          <div className="space-y-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${Math.round(compressProgress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Compressing video for faster playback…
            </p>
          </div>
        )}

        <Button type="submit" disabled={busy !== null}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : autoPublish ? (
            <Rocket className="size-4" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          {busy === "compressing"
            ? "Compressing…"
            : busy === "uploading"
              ? "Uploading…"
              : busy === "saving"
                ? "Submitting…"
                : autoPublish
                  ? "Upload & publish"
                  : "Upload & submit"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Your reels</h2>
        {mine.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <Film className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Your submitted reels will appear here.
            </p>
          </Card>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {mine.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/newsroom/reel/${r.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                >
                  <span className="min-w-0 truncate font-medium">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {STATUS_LABELS[r.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
