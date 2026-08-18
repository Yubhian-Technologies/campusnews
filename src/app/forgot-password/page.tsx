import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset password · CampusNews" };

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-dvh grow lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Forgot your password?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
