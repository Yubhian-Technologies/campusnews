import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { UserMenu } from "./UserMenu";

/**
 * Shared chrome for authenticated dashboards: header with brand + account menu.
 * `title` labels the current area; `nav` optionally renders section links.
 */
export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh grow flex-col bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                CampusNews
              </span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {nav}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl grow px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
