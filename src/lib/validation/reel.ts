import { z } from "zod";

const optionalId = z
  .string()
  .trim()
  .min(1)
  .nullish()
  .transform((v) => (v ? v : null));

/** Create payload — videoUrl/thumbnail are Storage download URLs from the upload. */
export const createReelSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(160),
  videoUrl: z.string().trim().url("A video upload is required."),
  thumbnail: z
    .string()
    .trim()
    .url()
    .nullish()
    .transform((v) => (v ? v : null)),
  locationId: optionalId,
  collegeId: optionalId,
  departmentId: optionalId,
});

export type CreateReelInput = z.infer<typeof createReelSchema>;

// Review actions reuse the article schema (submit/approve/reject/archive).
export { reviewActionSchema } from "./article";
