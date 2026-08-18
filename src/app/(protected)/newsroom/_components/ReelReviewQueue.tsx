"use client";

/**
 * Reviewer's queue of submitted reels — same single-stage approval as articles
 * (a Student reel needs College Admin approval; a Reporter reel any in-scope
 * reviewer). Approve publishes immediately; Reject requires a note and returns
 * it to the author.
 */
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Inbox, Loader2, X, Film } from "lucide-react";
import type { ReelRecord } from "@/lib/content/reelTypes";
import { reelActionClient } from "@/lib/api/reels-upload-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function scopeLabel(r: ReelRecord): string {
  return [r.locationId, r.collegeId].filter(Boolean).join(" · ") || "—";
}

export function ReelReviewQueue({ initial }: { initial: ReelRecord[] }) {
  const [reels, setReels] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const drop = (id: string) => setReels((p) => p.filter((r) => r.id !== id));

  async function approve(reel: ReelRecord) {
    setBusy(reel.id);
    try {
      await reelActionClient(reel.id, { action: "approve" });
      drop(reel.id);
      toast.success(`Published “${reel.title}”.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setBusy(null);
    }
  }

  async function reject(reel: ReelRecord) {
    if (note.trim().length < 3) {
      toast.error("Add a short note for the author.");
      return;
    }
    setBusy(reel.id);
    try {
      await reelActionClient(reel.id, { action: "reject", note });
      drop(reel.id);
      setRejecting(null);
      setNote("");
      toast.success("Sent back to the author.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed.");
    } finally {
      setBusy(null);
    }
  }

  if (reels.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Inbox className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No reels to review.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reels.map((reel) => (
        <Card key={reel.id} className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
              {reel.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reel.thumbnail} alt="" className="size-full object-cover" />
              ) : (
                <Film className="size-6 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">
                {scopeLabel(reel)} · by {reel.authorName}
              </div>
              <p className="font-medium">{reel.title}</p>
              <a
                href={reel.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Preview video
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" disabled={busy === reel.id} onClick={() => approve(reel)}>
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy === reel.id}
                onClick={() => setRejecting((r) => (r === reel.id ? null : reel.id))}
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
          </div>

          {rejecting === reel.id && (
            <div className="space-y-2 border-t pt-3">
              <Textarea
                rows={2}
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change?"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setRejecting(null); setNote(""); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy === reel.id}
                  onClick={() => reject(reel)}
                >
                  {busy === reel.id && <Loader2 className="size-4 animate-spin" />}
                  Send back
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
