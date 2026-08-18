import { redirect } from "next/navigation";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth/session";
import { homeRouteForRoles } from "@/lib/auth/roles";

export const metadata = { title: "Create account · CampusNews" };

export default async function RegisterPage() {
  // Already signed in with an ACTIVE account? Skip the register screen.
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
              Create your account <span aria-hidden>🎓</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Join CampusNews to read, like, and save — or contribute with
              your college email.
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
