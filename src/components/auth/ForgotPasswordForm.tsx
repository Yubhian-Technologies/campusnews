"use client";

/**
 * Forgot-password form: uses Firebase's built-in password reset (spec §12).
 * Always shows a neutral success message so email existence isn't leaked.
 */
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validation/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    // Ignore the specific outcome; never reveal whether the email exists.
    await resetPassword(values.email).catch(() => {});
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">
              {getValues("email")}
            </span>
            , we&apos;ve sent password reset instructions.
          </p>
        </div>
        <Button
          render={<Link href="/login" />}
          variant="outline"
          className="w-full"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </form>
  );
}
