/**
 * Zod schemas for article authoring and review.
 */
import { z } from "zod";
import { ARTICLE_CATEGORIES } from "@/lib/content/types";

const optionalId = z
  .string()
  .trim()
  .min(1)
  .nullish()
  .transform((v) => (v ? v : null));

const baseArticleFields = {
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(160),
  summary: z
    .string()
    .trim()
    .min(10, "Add a short summary (at least 10 characters).")
    .max(320),
  body: z.string().trim().min(20, "The article body is too short."),
  category: z.enum(ARTICLE_CATEGORIES),
  coverImage: z
    .string()
    .trim()
    .url("Cover image must be a valid URL.")
    .nullish()
    .transform((v) => (v ? v : null)),
  locationId: z.string().trim().min(1, "A location is required."),
  collegeId: optionalId,
  departmentId: optionalId,
};

export const createArticleSchema = z.object(baseArticleFields);
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = z.object({
  title: baseArticleFields.title.optional(),
  summary: baseArticleFields.summary.optional(),
  body: baseArticleFields.body.optional(),
  category: baseArticleFields.category.optional(),
  coverImage: baseArticleFields.coverImage.optional(),
  locationId: baseArticleFields.locationId.optional(),
  collegeId: baseArticleFields.collegeId.optional(),
  departmentId: baseArticleFields.departmentId.optional(),
});
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export const reviewActionSchema = z
  .object({
    action: z.enum(["submit", "approve", "reject", "archive"]),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "reject" && (!data.note || data.note.length < 3)) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "A rejection note is required so the author knows what to fix.",
      });
    }
  });
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
