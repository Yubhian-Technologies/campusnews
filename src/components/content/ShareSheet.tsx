"use client";

/**
 * Bottom share sheet with app targets. WhatsApp / Telegram / X / Facebook use
 * their web share intents; Copy uses the clipboard; "More" and Instagram use the
 * native share sheet (navigator.share) — Instagram has no web link-share API, so
 * it falls back to copying the link with a hint.
 */
import { toast } from "sonner";
import { Copy, MoreHorizontal, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function BrandIcon({ name }: { name: string }) {
  const common = { viewBox: "0 0 24 24", fill: "currentColor", className: "size-6" };
  switch (name) {
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0m0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324M12 16a4 4 0 110-8 4 4 0 010 8m6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.007C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function ShareSheet({
  open,
  onOpenChange,
  title,
  path,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Path to share, e.g. "/news/reels/xyz". Origin is added at click time. */
  path: string;
}) {
  if (!open) return null;

  const url =
    (typeof window !== "undefined" ? window.location.origin : "") + path;
  const text = `${title}`;

  function openWindow(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard.");
      }
    } catch {
      /* dismissed */
    }
    onOpenChange(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard.");
    } catch {
      /* ignore */
    }
    onOpenChange(false);
  }

  async function instagram() {
    // No web API to post a link to Instagram — use the native sheet if present
    // (Instagram shows up there on mobile), otherwise copy with a hint.
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied — open Instagram to share.");
      }
    } catch {
      /* dismissed */
    }
    onOpenChange(false);
  }

  const targets: {
    key: string;
    label: string;
    color: string;
    onClick: () => void;
  }[] = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      color: "bg-[#25D366]",
      onClick: () =>
        openWindow(
          `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        ),
    },
    {
      key: "instagram",
      label: "Instagram",
      color: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]",
      onClick: instagram,
    },
    {
      key: "telegram",
      label: "Telegram",
      color: "bg-[#26A5E4]",
      onClick: () =>
        openWindow(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        ),
    },
    {
      key: "x",
      label: "X",
      color: "bg-black",
      onClick: () =>
        openWindow(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        ),
    },
    {
      key: "facebook",
      label: "Facebook",
      color: "bg-[#1877F2]",
      onClick: () =>
        openWindow(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close share"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative w-full max-w-md rounded-t-3xl border-t bg-background p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">Share</h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {targets.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={t.onClick}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "grid size-14 place-items-center rounded-full text-white",
                  t.color,
                )}
              >
                <BrandIcon name={t.key} />
              </span>
              <span className="text-xs text-muted-foreground">{t.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={copyLink}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="grid size-14 place-items-center rounded-full bg-muted text-foreground">
              <Copy className="size-6" />
            </span>
            <span className="text-xs text-muted-foreground">Copy link</span>
          </button>

          <button
            type="button"
            onClick={nativeShare}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="grid size-14 place-items-center rounded-full bg-muted text-foreground">
              <MoreHorizontal className="size-6" />
            </span>
            <span className="text-xs text-muted-foreground">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
