import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";
import { homeRouteForRoles } from "@/lib/auth/roles";

export const metadata = { title: "Sign in · CampusNews" };

export default async function LoginPage() {
  // Already signed in with an ACTIVE account? Skip the login screen.
  const user = await getCurrentUser();
  if (user && user.profile.status === "ACTIVE") {
    redirect(homeRouteForRoles(user.profile.roleIds));
  }

  return (
    <div className="grid min-h-dvh grow lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your CampusNews account to continue.
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
