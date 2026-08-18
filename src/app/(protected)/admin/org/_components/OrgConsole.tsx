"use client";

/**
 * Cascading org manager: pick a Location to reveal its Colleges, pick a College
 * to reveal its Departments. Each column can add (slug id + name) and delete.
 * Deletion is blocked server-side when children still reference the entity.
 */
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import type { College, Department, Location } from "@/lib/org/types";
import { slugify } from "@/lib/content/slug";
import {
  createOrgAdmin,
  deleteOrgAdmin,
  listOrgAdmin,
} from "@/lib/api/org-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function OrgConsole({
  initialLocations,
}: {
  initialLocations: Location[];
}) {
  const [locations, setLocations] = useState(initialLocations);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selLocation, setSelLocation] = useState<string | null>(null);
  const [selCollege, setSelCollege] = useState<string | null>(null);

  const loadColleges = useCallback(async (locationId: string) => {
    try {
      setColleges(await listOrgAdmin<College>("colleges", { locationId }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load colleges.");
    }
  }, []);

  const loadDepartments = useCallback(async (collegeId: string) => {
    try {
      setDepartments(
        await listOrgAdmin<Department>("departments", { collegeId }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
    }
  }, []);

  // Cascade in the click handlers (not effects) to avoid cascading re-renders.
  const selectLocation = useCallback(
    async (id: string) => {
      setSelLocation(id);
      setSelCollege(null);
      setDepartments([]);
      await loadColleges(id);
    },
    [loadColleges],
  );

  const selectCollege = useCallback(
    async (id: string) => {
      setSelCollege(id);
      await loadDepartments(id);
    },
    [loadDepartments],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Column
        title="Locations"
        items={locations.map((l) => ({ id: l.id, name: l.name }))}
        selectedId={selLocation}
        onSelect={selectLocation}
        selectable
        addLabel="Add location"
        onAdd={async (id, name) => {
          await createOrgAdmin("locations", { id, name });
          setLocations(await listOrgAdmin<Location>("locations"));
        }}
        onDelete={async (id) => {
          await deleteOrgAdmin("locations", id);
          setLocations((prev) => prev.filter((l) => l.id !== id));
          if (selLocation === id) {
            setSelLocation(null);
            setColleges([]);
            setSelCollege(null);
            setDepartments([]);
          }
        }}
      />

      <Column
        title="Colleges"
        placeholder="Select a location to manage its colleges."
        disabled={!selLocation}
        items={colleges.map((c) => ({ id: c.id, name: c.name }))}
        selectedId={selCollege}
        onSelect={selectCollege}
        selectable
        addLabel="Add college"
        extra={{ label: "Email domain (optional)", placeholder: "vishnu.edu.in" }}
        onAdd={async (id, name, extra) => {
          await createOrgAdmin("colleges", {
            id,
            name,
            locationId: selLocation!,
            ...(extra ? { domain: extra } : {}),
          });
          await loadColleges(selLocation!);
        }}
        onDelete={async (id) => {
          await deleteOrgAdmin("colleges", id);
          setColleges((prev) => prev.filter((c) => c.id !== id));
          if (selCollege === id) {
            setSelCollege(null);
            setDepartments([]);
          }
        }}
      />

      <Column
        title="Departments"
        placeholder="Select a college to manage its departments."
        disabled={!selCollege}
        items={departments.map((d) => ({ id: d.id, name: d.name }))}
        addLabel="Add department"
        onAdd={async (id, name) => {
          await createOrgAdmin("departments", {
            id,
            name,
            locationId: selLocation!,
            collegeId: selCollege!,
          });
          await loadDepartments(selCollege!);
        }}
        onDelete={async (id) => {
          await deleteOrgAdmin("departments", id);
          setDepartments((prev) => prev.filter((d) => d.id !== id));
        }}
      />
    </div>
  );
}

interface Item {
  id: string;
  name: string;
}

function Column({
  title,
  items,
  selectedId,
  onSelect,
  selectable,
  addLabel,
  onAdd,
  onDelete,
  disabled,
  placeholder,
  extra,
}: {
  title: string;
  items: Item[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  selectable?: boolean;
  addLabel: string;
  onAdd: (id: string, name: string, extra?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  extra?: { label: string; placeholder: string };
}) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [extraVal, setExtraVal] = useState("");
  const [idEdited, setIdEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function onNameChange(v: string) {
    setName(v);
    if (!idEdited) setId(slugify(v));
  }

  async function add() {
    if (!id.trim() || !name.trim()) {
      toast.error("Both an ID and a name are required.");
      return;
    }
    setBusy(true);
    try {
      await onAdd(id.trim(), name.trim(), extraVal.trim() || undefined);
      toast.success(`${title.slice(0, -1)} added.`);
      setName("");
      setId("");
      setExtraVal("");
      setIdEdited(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(itemId: string) {
    setDeleting(itemId);
    try {
      await onDelete(itemId);
      toast.success("Removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card className={cn("flex flex-col p-4", disabled && "opacity-60")}>
      <h2 className="text-sm font-semibold">{title}</h2>

      {disabled ? (
        <p className="mt-4 text-sm text-muted-foreground">{placeholder}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-1">
            {items.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">
                None yet.
              </li>
            )}
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                  selectable && "cursor-pointer hover:bg-accent",
                  selectedId === item.id && "bg-accent",
                )}
                onClick={() => selectable && onSelect?.(item.id)}
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{item.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    {item.id}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void remove(item.id);
                    }}
                    disabled={deleting === item.id}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  {selectable && (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t pt-3">
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={`${title.slice(0, -1)} name`}
            />
            <Input
              value={id}
              onChange={(e) => {
                setIdEdited(true);
                setId(e.target.value);
              }}
              placeholder="id-slug"
            />
            {extra && (
              <Input
                value={extraVal}
                onChange={(e) => setExtraVal(e.target.value)}
                placeholder={extra.placeholder}
                aria-label={extra.label}
              />
            )}
            <Button
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={add}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {addLabel}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
