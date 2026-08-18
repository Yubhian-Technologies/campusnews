/**
 * Zod schemas for user create/update, including the role-conditional scope
 * rules from spec §17:
 *   - location_news_head  ⇒ requires locationId
 *   - college_head        ⇒ requires locationId + collegeId
 *   - reporter / student  ⇒ requires locationId (organization scope)
 *   - society_admin       ⇒ no location/college restriction
 */
import { z } from "zod";
import { ROLE_IDS } from "@/lib/auth/roles";

const roleIdSchema = z.enum(ROLE_IDS);

const USER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "PENDING_APPROVAL",
  "PENDING_EMAIL_VERIFICATION",
] as const;

const optionalScopeId = z
  .string()
  .trim()
  .min(1)
  .nullish()
  .transform((v) => (v ? v : null));

const baseUserFields = {
  displayName: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phoneNumber: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null)),
  roleIds: z.array(roleIdSchema).min(1, "Select at least one role."),
  locationId: optionalScopeId,
  collegeId: optionalScopeId,
  departmentId: optionalScopeId,
};

/**
 * Enforce role → scope requirements against a partial payload. Attaches issues
 * to the offending fields so the form can highlight them.
 */
function applyScopeRules(
  data: { roleIds: string[]; locationId?: string | null; collegeId?: string | null },
  ctx: z.RefinementCtx,
) {
  const roles = data.roleIds;
  const needsLocation =
    roles.includes("location_news_head") ||
    roles.includes("college_head") ||
    roles.includes("reporter") ||
    roles.includes("student");
  const needsCollege = roles.includes("college_head");

  if (needsLocation && !data.locationId) {
    ctx.addIssue({
      code: "custom",
      path: ["locationId"],
      message: "This role requires a location.",
    });
  }
  if (needsCollege && !data.collegeId) {
    ctx.addIssue({
      code: "custom",
      path: ["collegeId"],
      message: "College Admin requires a college.",
    });
  }
}

export const createUserSchema = z
  .object(baseUserFields)
  .superRefine((data, ctx) => applyScopeRules(data, ctx));

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    // Every field is optional: an update may patch any subset. Output keys are
    // optional so callers can pass, e.g., just { status }.
    displayName: baseUserFields.displayName.optional(),
    phoneNumber: baseUserFields.phoneNumber.optional(),
    status: z.enum(USER_STATUSES).optional(),
    roleIds: baseUserFields.roleIds.optional(),
    locationId: baseUserFields.locationId.optional(),
    collegeId: baseUserFields.collegeId.optional(),
    departmentId: baseUserFields.departmentId.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.roleIds) {
      applyScopeRules(
        {
          roleIds: data.roleIds,
          locationId: data.locationId,
          collegeId: data.collegeId,
        },
        ctx,
      );
    }
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
