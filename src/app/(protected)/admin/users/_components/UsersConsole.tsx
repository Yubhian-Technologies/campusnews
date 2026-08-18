"use client";

/**
 * Interactive user-management console (spec §16): search, filters, create/edit,
 * status actions, and password reset. Optimistically refreshes from the server
 * after each mutation so the table always reflects authoritative state.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Plus,
  Search,
  UserCog,
  KeyRound,
  CheckCircle2,
  PauseCircle,
  Ban,
} from "lucide-react";
import {
  ROLE_LABELS,
  ROLE_IDS,
  type RoleId,
} from "@/lib/auth/roles";
import type { UserProfile, UserStatus } from "@/lib/types";
import {
  listUsersClient,
  resetUserPasswordClient,
  updateUserClient,
} from "@/lib/api/users-client";
import { StatusBadge } from "@/components/users/StatusBadge";
import { UserFormDialog } from "./UserFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_OPTIONS: UserStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "PENDING_APPROVAL",
  "PENDING_EMAIL_VERIFICATION",
];

const ALL = "__all__";

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsersConsole({
  initialUsers,
  societyId,
}: {
  initialUsers: UserProfile[];
  societyId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [locationFilter, setLocationFilter] = useState<string>(ALL);
  const [collegeFilter, setCollegeFilter] = useState<string>(ALL);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const locations = useMemo(
    () => [...new Set(users.map((u) => u.locationId).filter(Boolean))] as string[],
    [users],
  );
  const colleges = useMemo(
    () => [...new Set(users.map((u) => u.collegeId).filter(Boolean))] as string[],
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !`${u.displayName} ${u.email}`.toLowerCase().includes(q))
        return false;
      if (roleFilter !== ALL && !u.roleIds.includes(roleFilter as RoleId))
        return false;
      if (statusFilter !== ALL && u.status !== statusFilter) return false;
      if (locationFilter !== ALL && u.locationId !== locationFilter) return false;
      if (collegeFilter !== ALL && u.collegeId !== collegeFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter, locationFilter, collegeFilter]);

  async function refresh() {
    try {
      setUsers(await listUsersClient());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh.");
    }
  }

  async function changeStatus(user: UserProfile, status: UserStatus) {
    setBusyUid(user.uid);
    try {
      const updated = await updateUserClient(user.uid, { status });
      setUsers((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
      toast.success(`${user.displayName} is now ${status.toLowerCase()}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyUid(null);
    }
  }

  async function resetPassword(user: UserProfile) {
    setBusyUid(user.uid);
    try {
      const link = await resetUserPasswordClient(user.uid);
      await navigator.clipboard?.writeText(link).catch(() => {});
      toast.success("Password reset link copied to clipboard.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset.");
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage internal users, roles, and access.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create user
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <FilterSelect
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="Role"
          options={ROLE_IDS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
        {locations.length > 0 && (
          <FilterSelect
            value={locationFilter}
            onChange={setLocationFilter}
            placeholder="Location"
            options={locations.map((l) => ({ value: l, label: l }))}
          />
        )}
        {colleges.length > 0 && (
          <FilterSelect
            value={collegeFilter}
            onChange={setCollegeFilter}
            placeholder="College"
            options={colleges.map((c) => ({ value: c, label: c }))}
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>College</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No users match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">
                    {user.displayName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.roleIds.map((r) => ROLE_LABELS[r]).join(", ") || "—"}
                  </TableCell>
                  <TableCell>{user.locationId ?? "—"}</TableCell>
                  <TableCell>{user.collegeId ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      user={user}
                      busy={busyUid === user.uid}
                      onEdit={() => setEditing(user)}
                      onStatus={(s) => changeStatus(user, s)}
                      onReset={() => resetPassword(user)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        societyId={societyId}
        onSaved={refresh}
      />
      <UserFormDialog
        mode="edit"
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        societyId={societyId}
        user={editing ?? undefined}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? ALL)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {placeholder.toLowerCase()}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RowActions({
  user,
  busy,
  onEdit,
  onStatus,
  onReset,
}: {
  user: UserProfile;
  busy: boolean;
  onEdit: () => void;
  onStatus: (status: UserStatus) => void;
  onReset: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" disabled={busy} />
        }
      >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <UserCog className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReset}>
          <KeyRound className="size-4" />
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status !== "ACTIVE" && (
          <DropdownMenuItem onClick={() => onStatus("ACTIVE")}>
            <CheckCircle2 className="size-4" />
            Activate
          </DropdownMenuItem>
        )}
        {user.status !== "INACTIVE" && (
          <DropdownMenuItem onClick={() => onStatus("INACTIVE")}>
            <PauseCircle className="size-4" />
            Deactivate
          </DropdownMenuItem>
        )}
        {user.status !== "SUSPENDED" && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onStatus("SUSPENDED")}
          >
            <Ban className="size-4" />
            Suspend
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
