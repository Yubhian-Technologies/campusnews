"use client";

/**
 * Cascading scope picker (Location → College → Department) backed by /api/org.
 * Controlled: parent owns the value and receives changes. Selecting a location
 * clears college+department; selecting a college clears department. College and
 * department are optional (a "None" choice clears them).
 */
import { useEffect, useState } from "react";
import type { OrgOption } from "@/lib/org/types";
import { fetchOrgOptions } from "@/lib/api/org-client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export interface ScopeValue {
  locationId: string | null;
  collegeId: string | null;
  departmentId: string | null;
}

export function ScopeSelector({
  value,
  onChange,
  disabled,
  errors,
}: {
  value: ScopeValue;
  onChange: (next: ScopeValue) => void;
  disabled?: boolean;
  errors?: Partial<Record<keyof ScopeValue, string>>;
}) {
  const [locations, setLocations] = useState<OrgOption[]>([]);
  const [colleges, setColleges] = useState<OrgOption[]>([]);
  const [departments, setDepartments] = useState<OrgOption[]>([]);

  // Load locations once.
  useEffect(() => {
    fetchOrgOptions("locations")
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  // Load colleges when the location changes (empty when no location).
  useEffect(() => {
    let active = true;
    const load = value.locationId
      ? fetchOrgOptions("colleges", { locationId: value.locationId })
      : Promise.resolve<OrgOption[]>([]);
    load
      .then((opts) => active && setColleges(opts))
      .catch(() => active && setColleges([]));
    return () => {
      active = false;
    };
  }, [value.locationId]);

  // Load departments when the college changes (empty when no college).
  useEffect(() => {
    let active = true;
    const load = value.collegeId
      ? fetchOrgOptions("departments", { collegeId: value.collegeId })
      : Promise.resolve<OrgOption[]>([]);
    load
      .then((opts) => active && setDepartments(opts))
      .catch(() => active && setDepartments([]));
    return () => {
      active = false;
    };
  }, [value.collegeId]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Location" error={errors?.locationId}>
        <Select
          value={value.locationId ?? ""}
          onValueChange={(v) =>
            onChange({
              locationId: v || null,
              collegeId: null,
              departmentId: null,
            })
          }
        >
          <SelectTrigger disabled={disabled}>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="College" error={errors?.collegeId}>
        <Select
          value={value.collegeId ?? NONE}
          onValueChange={(v) =>
            onChange({
              ...value,
              collegeId: v && v !== NONE ? v : null,
              departmentId: null,
            })
          }
        >
          <SelectTrigger disabled={disabled || !value.locationId}>
            <SelectValue placeholder="Select college" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— None —</SelectItem>
            {colleges.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Department" error={errors?.departmentId}>
        <Select
          value={value.departmentId ?? NONE}
          onValueChange={(v) =>
            onChange({ ...value, departmentId: v && v !== NONE ? v : null })
          }
        >
          <SelectTrigger disabled={disabled || !value.collegeId}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— None —</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
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
