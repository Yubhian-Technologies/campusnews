import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Public landing page — no authentication required (spec §5). The public news
 * site is built out in a later iteration; for now it links to sign-in.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh grow flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              CampusNews
            </span>
          </Link>
          <Button render={<Link href="/login" />} size="sm">
            Sign in
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl grow flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Every campus has a story.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          CampusNews is the newsroom for your society, colleges, and reporters —
          publish what matters, from campus to community.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button render={<Link href="/news" />} size="lg">
            Read the news
          </Button>
          <Button render={<Link href="/login" />} size="lg" variant="outline">
            Staff sign in
          </Button>
        </div>
      </main>
    </div>
  );
}
