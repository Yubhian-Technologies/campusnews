"use client";

/**
 * Typed client-side wrappers around the /api/admin/users endpoints. Centralizes
 * fetch + error handling so the console components stay declarative.
 */
import type { UserProfile } from "@/lib/types";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validation/user";

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Request failed. Please try again.";
}

export async function listUsersClient(
  params: Record<string, string> = {},
): Promise<UserProfile[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { users: UserProfile[] };
  return data.users;
}

export interface CreateUserResult {
  uid: string;
  setupLink: string | null;
}

export async function createUserClient(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as CreateUserResult;
  return data;
}

export async function updateUserClient(
  uid: string,
  patch: UpdateUserInput,
): Promise<UserProfile> {
  const res = await fetch(`/api/admin/users/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { user: UserProfile };
  return data.user;
}

export async function resetUserPasswordClient(uid: string): Promise<string> {
  const res = await fetch(`/api/admin/users/${uid}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset_password" }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { resetLink: string };
  return data.resetLink;
}
