/**
 * Zod schemas for org entities. IDs are human-chosen slugs (lowercase, url-safe)
 * so scopes stay readable and existing references remain valid.
 */
import { z } from "zod";

const slugId = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "ID must be at least 2 characters.")
  .max(40)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.");

const name = z.string().trim().min(2, "Name is required.").max(120);

export const createLocationSchema = z.object({ id: slugId, name });
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

const domain = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
    "Enter a valid domain like vishnu.edu.in",
  )
  .nullish()
  .transform((v) => (v ? v : null));

export const createCollegeSchema = z.object({
  id: slugId,
  name,
  locationId: z.string().trim().min(1, "Select a location."),
  domain,
});
export type CreateCollegeInput = z.infer<typeof createCollegeSchema>;

export const createDepartmentSchema = z.object({
  id: slugId,
  name,
  locationId: z.string().trim().min(1, "Select a location."),
  collegeId: z.string().trim().min(1, "Select a college."),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
