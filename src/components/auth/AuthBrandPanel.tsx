/**
 * Left-hand campus visual for the auth screens (spec §19). Pure CSS gradient +
 * mesh so there's no external image dependency; swap in real campus imagery
 * later by layering a <next/image> behind the overlay.
 */
import { GraduationCap } from "lucide-react";

export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Gradient mesh background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 20% 20%, #6d28d9 0%, transparent 60%), radial-gradient(50% 50% at 90% 30%, #db2777 0%, transparent 55%), radial-gradient(60% 70% at 60% 100%, #2563eb 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex items-center gap-2 text-white">
        <div className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <GraduationCap className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">CampusNews</span>
      </div>

      <div className="relative max-w-md text-white">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Every campus has a story.
        </h2>
        <p className="mt-3 text-base text-white/70">
          The newsroom for your society, colleges, and reporters — publish what
          matters, from campus to community.
        </p>
      </div>

      <div className="relative text-sm text-white/50">
        © {new Date().getFullYear()} CampusNews. All rights reserved.
      </div>
    </div>
  );
}
