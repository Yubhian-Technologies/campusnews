"use client";

/**
 * Create / edit user dialog. Shares one layout across both modes; validates with
 * the matching zod schema (createUserSchema / updateUserSchema) so the
 * role-conditional scope rules from spec §17 are enforced client-side too, then
 * again server-side. On create, surfaces the password-setup link.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  ROLE_IDS,
  ROLE_LABELS,
  type RoleId,
} from "@/lib/auth/roles";
import type { UserProfile, UserStatus } from "@/lib/types";
import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/validation/user";
import { createUserClient, updateUserClient } from "@/lib/api/users-client";
import { ScopeSelector } from "@/components/org/ScopeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: UserStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "PENDING_APPROVAL",
  "PENDING_EMAIL_VERIFICATION",
];

interface FormState {
  displayName: string;
  email: string;
  phoneNumber: string;
  roleIds: RoleId[];
  locationId: string;
  collegeId: string;
  departmentId: string;
  status: UserStatus;
}

function initialForm(user?: UserProfile): FormState {
  if (!user) {
    return {
      displayName: "",
      email: "",
      phoneNumber: "",
      roleIds: [],
      locationId: "",
      collegeId: "",
      departmentId: "",
      status: "PENDING_EMAIL_VERIFICATION",
    };
  }
  return {
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? "",
    roleIds: user.roleIds,
    locationId: user.locationId ?? "",
    collegeId: user.collegeId ?? "",
    departmentId: user.departmentId ?? "",
    status: user.status,
  };
}

/**
 * Outer shell owns the Dialog + open state. The inner form is remounted (keyed)
 * each time the dialog opens so its state initializes from props via useState —
 * no state-syncing effect, no cascading renders.
 */
export function UserFormDialog({
  mode,
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  societyId: string;
  user?: UserProfile;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create user" : "Edit user"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create an internal account. The user sets their own password via a setup link."
              : "Update this user's profile, roles, scope, and status."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <UserForm
            key={user?.uid ?? "new"}
            mode={mode}
            user={user}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  mode,
  user,
  onOpenChange,
  onSaved,
}: {
  mode: "create" | "edit";
  user?: UserProfile;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(user));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleRole(role: RoleId) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(role)
        ? f.roleIds.filter((r) => r !== role)
        : [...f.roleIds, role],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      displayName: form.displayName,
      email: form.email,
      phoneNumber: form.phoneNumber || null,
      roleIds: form.roleIds,
      locationId: form.locationId || null,
      collegeId: form.collegeId || null,
      departmentId: form.departmentId || null,
      ...(mode === "edit" ? { status: form.status } : {}),
    };

    const schema = mode === "create" ? createUserSchema : updateUserSchema;
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
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const { setupLink } = await createUserClient(
          parsed.data as Parameters<typeof createUserClient>[0],
        );
        toast.success("User created.", {
          description: setupLink
            ? "A password-setup link is ready to share."
            : undefined,
          action: setupLink
            ? {
                label: "Copy link",
                onClick: () =>
                  void navigator.clipboard?.writeText(setupLink),
              }
            : undefined,
        });
      } else if (user) {
        await updateUserClient(
          user.uid,
          parsed.data as Parameters<typeof updateUserClient>[1],
        );
        toast.success("User updated.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Full name" error={errors.displayName}>
        <Input
          value={form.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          placeholder="Rahul Kumar"
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          disabled={mode === "edit"}
          onChange={(e) => set("email", e.target.value)}
          placeholder="rahul@example.com"
        />
      </Field>

      <Field label="Roles" error={errors.roleIds}>
        <div className="flex flex-wrap gap-2">
          {ROLE_IDS.map((role) => {
            const active = form.roleIds.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
      </Field>

      <ScopeSelector
        value={{
          locationId: form.locationId || null,
          collegeId: form.collegeId || null,
          departmentId: form.departmentId || null,
        }}
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

      <Field label="Phone" error={errors.phoneNumber}>
        <Input
          value={form.phoneNumber}
          onChange={(e) => set("phoneNumber", e.target.value)}
          placeholder="Optional"
        />
      </Field>

      {mode === "edit" && (
        <Field label="Status" error={errors.status}>
          <Select
            value={form.status}
            onValueChange={(v) => v && set("status", v as UserStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Create user" : "Save changes"}
        </Button>
      </DialogFooter>
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
