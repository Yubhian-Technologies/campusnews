import { NewsTopBar } from "@/components/content/NewsTopBar";
import { NewsBottomNav } from "@/components/content/NewsBottomNav";

/**
 * Mobile app shell for the public news experience: sticky top bar, a centered
 * phone-width column, and a fixed bottom tab bar. Applies to all /news/* routes.
 */
export default function NewsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <NewsTopBar />
      {/* pb-20 clears the fixed bottom nav (~4rem) with a little breathing room */}
      <main className="mx-auto w-full max-w-xl grow px-4 pb-20 pt-4">
        {children}
      </main>
      <NewsBottomNav />
    </div>
  );
}
