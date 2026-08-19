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
  coverImage: string;
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

  const [form, setForm] = useState<FormState>({
    title: article?.title ?? "",
    summary: article?.summary ?? "",
    body: article?.body ?? "",
    category: article?.category ?? initialCategory ?? "CAMPUS",
    coverImage: article?.coverImage ?? "",
    locationId: article?.locationId ?? profile.locationId ?? "",
    collegeId: article?.collegeId ?? profile.collegeId ?? "",
    departmentId: article?.departmentId ?? profile.departmentId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [useCoverUrl, setUseCoverUrl] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCoverFile(file: File | null) {
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadUserAsset(file, "article-uploads");
      set("coverImage", url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setCoverUploading(false);
    }
  }

  /** Validate + persist. Returns the article id on success, else null. */
  async function persist(): Promise<string | null> {
    setErrors({});
    const payload = {
      title: form.title,
      summary: form.summary,
      body: form.body,
      category: form.category,
      coverImage: form.coverImage || null,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" error={errors.category}>
          <Select
            value={form.category}
            onValueChange={(v) => v && set("category", v as ArticleCategory)}
          >
            <SelectTrigger disabled={!editable}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Cover image (optional)" error={errors.coverImage}>
          {form.coverImage ? (
            <div className="space-y-2">
              <div className="relative h-36 w-full overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverImage}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              {editable && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    set("coverImage", "");
                    setUseCoverUrl(false);
                  }}
                >
                  <X className="size-4" />
                  Remove
                </Button>
              )}
            </div>
          ) : useCoverUrl ? (
            <div className="space-y-1.5">
              <Input
                autoFocus
                value={form.coverImage}
                disabled={!editable}
                onChange={(e) => set("coverImage", e.target.value)}
                placeholder="https://…"
              />
              <button
                type="button"
                onClick={() => setUseCoverUrl(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Upload a file instead
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Input
                type="file"
                accept="image/*"
                disabled={!editable || coverUploading}
                onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
              />
              {coverUploading ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading…
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setUseCoverUrl(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Or paste an image URL
                </button>
              )}
            </div>
          )}
        </Field>
      </div>

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
          <Button type="submit" variant="outline" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save draft
          </Button>
          <Button type="button" disabled={saving} onClick={() => onSave(true)}>
            {autoPublish ? (
              <Rocket className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
            {autoPublish ? "Publish" : "Save & submit"}
          </Button>
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
