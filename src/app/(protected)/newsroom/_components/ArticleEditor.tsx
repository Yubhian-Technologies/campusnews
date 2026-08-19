"use client";

/**
 * Create / edit an article. Non-admin authors are pinned to their own
 * location/college scope (read-only), matching the server-side constraint in
 * the /api/articles handlers. Save persists a DRAFT edit; the submit button
 * chains a submit action — for Super Admin / Location Admin / College Admin
 * authors that publishes immediately (see authorAutoPublishes); for
 * Reporter/Student it goes to review.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Rocket, X } from "lucide-react";
import {
  ARTICLE_CATEGORIES,
  CATEGORY_LABELS,
  type Article,
  type ArticleCategory,
} from "@/lib/content/types";
import { authorAutoPublishes } from "@/lib/content/authorize";
import {
  createArticleSchema,
  MAX_ARTICLE_IMAGES,
  updateArticleSchema,
} from "@/lib/validation/article";
import {
  articleActionClient,
  createArticleClient,
  updateArticleClient,
} from "@/lib/api/articles-client";
import { uploadUserAsset } from "@/lib/firebase/upload-client";
import type { UserProfile } from "@/lib/types";
import { ScopeSelector } from "@/components/org/ScopeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormState {
  title: string;
  summary: string;
  body: string;
  category: ArticleCategory;
  /** In display order; the first is used as the cover/preview image. */
  images: string[];
  locationId: string;
  collegeId: string;
  departmentId: string;
}

export function ArticleEditor({
  profile,
  article,
  initialCategory,
  afterSaveHref = "/newsroom",
}: {
  profile: UserProfile;
  article?: Article;
  /** Pre-fills category for a quick-create entry point (e.g. "Event"). */
  initialCategory?: ArticleCategory;
  /** Where to navigate after a successful save/submit. Defaults to the
   *  Newsroom's own article list; the public contribute flow overrides this
   *  so writers stay inside the mobile app shell instead of being dropped
   *  into the separate staff Newsroom UI. */
  afterSaveHref?: string;
}) {
  const router = useRouter();
  const isAdmin = profile.roleIds.includes("society_admin");
  const autoPublish = authorAutoPublishes(profile);
  const editable = article
    ? article.status === "DRAFT" || article.status === "REJECTED" || isAdmin
    : true;
  // "Submit"/"Publish" is only a valid transition from DRAFT/REJECTED (or a
  // brand-new article) — matches ACTION_TRANSITIONS.submit.from server-side.
  // An admin editing an already-submitted/published article is still
  // `editable` (to fix content) but must not re-trigger that transition —
  // the API correctly 409s "Cannot submit an article that is PUBLISHED."
  const canSubmit =
    !article || article.status === "DRAFT" || article.status === "REJECTED";

  const [form, setForm] = useState<FormState>({
    title: article?.title ?? "",
    summary: article?.summary ?? "",
    body: article?.body ?? "",
    category: article?.category ?? initialCategory ?? "CAMPUS",
    // Legacy articles only ever had a single coverImage — show it as a
    // one-item gallery so editing an old article doesn't lose it.
    images: article?.images?.length
      ? article.images
      : article?.coverImage
        ? [article.coverImage]
        : [],
    locationId: article?.locationId ?? profile.locationId ?? "",
    collegeId: article?.collegeId ?? profile.collegeId ?? "",
    departmentId: article?.departmentId ?? profile.departmentId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [imageUrlDraft, setImageUrlDraft] = useState("");

  // Events are admin-tier only (College/Location/Super Admin — same roles as
  // authorAutoPublishes, enforced again server-side in /api/articles). Keep
  // it selectable if the article already has it (e.g. an old draft), so
  // editing doesn't force a category change out from under someone.
  const categoryOptions = ARTICLE_CATEGORIES.filter(
    (c) => c !== "EVENTS" || autoPublish || form.category === "EVENTS",
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAddImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_ARTICLE_IMAGES - form.images.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_ARTICLE_IMAGES} images.`);
      return;
    }
    const selected = Array.from(files);
    const toUpload = selected.slice(0, remaining);
    if (selected.length > toUpload.length) {
      toast.error(
        `Only added the first ${toUpload.length} — up to ${MAX_ARTICLE_IMAGES} images per article.`,
      );
    }
    setImagesUploading(true);
    try {
      const urls = await Promise.all(
        toUpload.map((file) => uploadUserAsset(file, "article-uploads")),
      );
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImagesUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function addImageUrl() {
    const url = imageUrlDraft.trim();
    if (!url) return;
    if (form.images.length >= MAX_ARTICLE_IMAGES) {
      toast.error(`You can add up to ${MAX_ARTICLE_IMAGES} images.`);
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setImageUrlDraft("");
  }

  /** Validate + persist. Returns the article id on success, else null. */
  async function persist(): Promise<string | null> {
    setErrors({});
    const payload = {
      title: form.title,
      summary: form.summary,
      body: form.body,
      category: form.category,
      images: form.images,
      locationId: form.locationId,
      collegeId: form.collegeId || null,
      departmentId: form.departmentId || null,
    };
    const schema = article ? updateArticleSchema : createArticleSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return null;
    }

    if (article) {
      await updateArticleClient(
        article.id,
        parsed.data as Parameters<typeof updateArticleClient>[1],
      );
      return article.id;
    }
    return createArticleClient(
      parsed.data as Parameters<typeof createArticleClient>[0],
    );
  }

  async function onSave(submitAfter: boolean) {
    setSaving(true);
    try {
      const id = await persist();
      if (!id) return;
      if (submitAfter) {
        await articleActionClient(id, { action: "submit" });
        toast.success(autoPublish ? "Published." : "Saved and submitted for review.");
      } else {
        toast.success(article ? "Changes saved." : "Draft created.");
      }
      router.push(afterSaveHref);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(false);
      }}
    >
      {!editable && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          This article is {article?.status.toLowerCase()} and can no longer be
          edited here.
        </div>
      )}

      <Field label="Title" error={errors.title}>
        <Input
          value={form.title}
          disabled={!editable}
          onChange={(e) => set("title", e.target.value)}
          placeholder="A clear, specific headline"
        />
      </Field>

      <Field label="Summary" error={errors.summary}>
        <Textarea
          rows={2}
          value={form.summary}
          disabled={!editable}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="One or two sentences that appear in listings."
        />
      </Field>

      <Field label="Category" error={errors.category}>
        <Select
          value={form.category}
          onValueChange={(v) => v && set("category", v as ArticleCategory)}
        >
          <SelectTrigger disabled={!editable}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={`Images (optional, up to ${MAX_ARTICLE_IMAGES})`}
        error={errors.images}
      >
        <div className="space-y-2">
          {form.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {form.images.map((url, i) => (
                <div
                  key={`${i}-${url}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {editable && form.images.length < MAX_ARTICLE_IMAGES && (
            <div className="space-y-1.5">
              <Input
                type="file"
                accept="image/*"
                multiple
                disabled={imagesUploading}
                onChange={(e) => {
                  void handleAddImageFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {imagesUploading ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading…
                </p>
              ) : useImageUrl ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={imageUrlDraft}
                    onChange={(e) => setImageUrlDraft(e.target.value)}
                    placeholder="https://…"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setUseImageUrl(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Or paste an image URL
                </button>
              )}
            </div>
          )}
        </div>
      </Field>

      {isAdmin ? (
        <ScopeSelector
          value={{
            locationId: form.locationId || null,
            collegeId: form.collegeId || null,
            departmentId: form.departmentId || null,
          }}
          disabled={!editable}
          onChange={(next) =>
            setForm((f) => ({
              ...f,
              locationId: next.locationId ?? "",
              collegeId: next.collegeId ?? "",
              departmentId: next.departmentId ?? "",
            }))
          }
          errors={{
            locationId: errors.locationId,
            collegeId: errors.collegeId,
            departmentId: errors.departmentId,
          }}
        />
      ) : (
        <Field label="Scope">
          <div className="rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {[form.locationId, form.collegeId, form.departmentId]
              .filter(Boolean)
              .join(" · ") || "No scope assigned to your account."}
          </div>
        </Field>
      )}

      <Field label="Body" error={errors.body}>
        <Textarea
          rows={14}
          value={form.body}
          disabled={!editable}
          onChange={(e) => set("body", e.target.value)}
          placeholder="Write your story. Separate paragraphs with a blank line."
          className="font-mono text-sm"
        />
      </Field>

      {editable && (
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant={canSubmit ? "outline" : "default"}
            disabled={saving}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {canSubmit ? "Save draft" : "Save changes"}
          </Button>
          {canSubmit && (
            <Button type="button" disabled={saving} onClick={() => onSave(true)}>
              {autoPublish ? (
                <Rocket className="size-4" />
              ) : (
                <Send className="size-4" />
              )}
              {autoPublish ? "Publish" : "Save & submit"}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
